import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

import type {
  AdminMetrics,
  AuditEventSummary,
  FailedAnalysisSummary,
  SupportAccountSummary,
  SystemErrorSummary,
} from "./types";

type CountFilter =
  | { kind: "eq"; column: string; value: string }
  | { kind: "in"; column: string; values: string[] }
  | { kind: "is-null"; column: string }
  | { kind: "or"; expression: string };

async function exactCount(
  table: string,
  filters: CountFilter[] = [],
): Promise<number> {
  const admin = createAdminClient();
  let query = admin.from(table).select("id", { count: "exact", head: true });

  for (const filter of filters) {
    if (filter.kind === "eq") {
      query = query.eq(filter.column, filter.value);
    } else if (filter.kind === "in") {
      query = query.in(filter.column, filter.values);
    } else if (filter.kind === "is-null") {
      query = query.is(filter.column, null);
    } else {
      query = query.or(filter.expression);
    }
  }

  const { count, error } = await query;
  if (error) throw new Error(`Could not count ${table}.`);
  return count ?? 0;
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const [
    registeredUsers,
    activeUsers,
    totalCases,
    totalAnalyses,
    failedAnalyses,
    paidReports,
    activeMemberships,
    generatedReports,
    unresolvedSystemErrors,
  ] = await Promise.all([
    exactCount("user_profiles"),
    exactCount("user_profiles", [
      { kind: "eq", column: "account_status", value: "active" },
    ]),
    exactCount("cases"),
    exactCount("chat_analyses"),
    exactCount("chat_analyses", [
      { kind: "in", column: "status", values: ["failed", "rejected"] },
    ]),
    exactCount("payments", [{ kind: "eq", column: "status", value: "paid" }]),
    exactCount("subscriptions", [
      {
        kind: "in",
        column: "status",
        values: ["active", "trialing", "past_due"],
      },
    ]),
    exactCount("reports"),
    exactCount("system_errors", [{ kind: "is-null", column: "resolved_at" }]),
  ]);

  return {
    registeredUsers,
    activeUsers,
    totalCases,
    totalAnalyses,
    failedAnalyses,
    paidReports,
    activeMemberships,
    generatedReports,
    unresolvedSystemErrors,
  };
}

export async function listFailedAnalyses(
  limit = 100,
): Promise<FailedAnalysisSummary[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("chat_analyses")
    .select(
      "id,request_id,status,error_code,model_identifier,prompt_version,schema_version,created_at,completed_at",
    )
    .in("status", ["failed", "rejected"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error("Failed analysis metadata could not be loaded.");

  return (data ?? []).map((row) => ({
    id: row.id,
    requestId: row.request_id,
    status: row.status,
    errorCode: row.error_code,
    modelIdentifier: row.model_identifier,
    promptVersion: row.prompt_version,
    schemaVersion: row.schema_version,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  })) as FailedAnalysisSummary[];
}

export async function listSystemErrors(
  limit = 100,
): Promise<SystemErrorSummary[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("system_errors")
    .select(
      "id,request_id,error_class,sanitized_message,service,severity,retryable,resolved_at,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error("System error metadata could not be loaded.");

  return (data ?? []).map((row) => ({
    id: row.id,
    requestId: row.request_id,
    errorClass: row.error_class,
    sanitizedMessage: row.sanitized_message,
    service: row.service,
    severity: row.severity,
    retryable: row.retryable,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
  })) as SystemErrorSummary[];
}

export async function lookupSupportAccount(input: {
  email?: string;
  userId?: string;
}): Promise<SupportAccountSummary | null> {
  const admin = createAdminClient();
  let profileQuery = admin
    .from("user_profiles")
    .select(
      "id,auth_user_id,email_normalized,role,account_status,created_at,updated_at",
    );

  if (input.userId) {
    profileQuery = profileQuery.eq("auth_user_id", input.userId);
  } else {
    profileQuery = profileQuery.eq(
      "email_normalized",
      input.email!.toLowerCase(),
    );
  }

  const { data: profile, error } = await profileQuery.maybeSingle();
  if (error) throw new Error("The account lookup could not be completed.");
  if (!profile) return null;

  const now = new Date().toISOString();
  const [
    cases,
    completedAnalyses,
    payments,
    activeEntitlements,
    latestPayment,
    latestSubscription,
  ] = await Promise.all([
    exactCount("cases", [
      { kind: "eq", column: "auth_user_id", value: profile.auth_user_id },
    ]),
    exactCount("chat_analyses", [
      { kind: "eq", column: "auth_user_id", value: profile.auth_user_id },
      { kind: "eq", column: "status", value: "completed" },
    ]),
    exactCount("payments", [
      { kind: "eq", column: "user_id", value: profile.auth_user_id },
    ]),
    exactCount("entitlements", [
      { kind: "eq", column: "user_id", value: profile.auth_user_id },
      { kind: "eq", column: "status", value: "active" },
      { kind: "or", expression: `ends_at.is.null,ends_at.gt.${now}` },
    ]),
    admin
      .from("payments")
      .select("status")
      .eq("user_id", profile.auth_user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("subscriptions")
      .select("status,current_period_end")
      .eq("user_id", profile.auth_user_id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    authUserId: profile.auth_user_id,
    profileId: profile.id,
    email: profile.email_normalized,
    role: profile.role,
    accountStatus: profile.account_status,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
    counts: {
      cases,
      completedAnalyses,
      payments,
      activeEntitlements,
    },
    latestPaymentStatus: latestPayment.data?.status ?? null,
    latestSubscriptionStatus: latestSubscription.data?.status ?? null,
    latestSubscriptionPeriodEnd:
      latestSubscription.data?.current_period_end ?? null,
  } as SupportAccountSummary;
}

export async function listAuditEvents(
  limit = 100,
): Promise<AuditEventSummary[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("audit_events")
    .select(
      "id,actor_user_id,target_user_id,case_id,event_type,metadata,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error("Audit events could not be loaded.");

  return (data ?? []).map((row) => ({
    id: row.id,
    actorUserId: row.actor_user_id,
    targetUserId: row.target_user_id,
    caseId: row.case_id,
    eventType: row.event_type,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
  }));
}

export async function recordAuditEvent(input: {
  actorUserId: string | null;
  targetUserId?: string | null;
  caseId?: string | null;
  eventType: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("audit_events").insert({
    actor_user_id: input.actorUserId,
    target_user_id: input.targetUserId ?? null,
    case_id: input.caseId ?? null,
    event_type: input.eventType,
    metadata: input.metadata ?? {},
  });
  if (error) throw new Error("The audit event could not be recorded.");
}
