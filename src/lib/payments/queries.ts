import "server-only";

import { createClient } from "@/lib/supabase/server";

import { summarizeEntitlements } from "./entitlements";
import type { EntitlementSummary, SubscriptionSummary } from "./types";

export async function getEntitlementSummary(
  userId: string,
  caseId?: string,
): Promise<EntitlementSummary> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [{ data: caseEntitlements }, { data: memberships }] = await Promise.all(
    [
      caseId
        ? supabase
            .from("entitlements")
            .select(
              "ends_at,status,usage_limit,usage_count,source_type,source_id",
            )
            .eq("user_id", userId)
            .eq("case_id", caseId)
            .eq("entitlement_type", "case_full_report")
            .eq("status", "active")
            .or(`ends_at.is.null,ends_at.gt.${now}`)
            .order("created_at", { ascending: false })
            .limit(1)
        : Promise.resolve({ data: [] }),
      supabase
        .from("entitlements")
        .select("ends_at,status,usage_limit,usage_count,source_type,source_id")
        .eq("user_id", userId)
        .is("case_id", null)
        .eq("entitlement_type", "membership")
        .eq("status", "active")
        .or(`ends_at.is.null,ends_at.gt.${now}`)
        .order("created_at", { ascending: false })
        .limit(1),
    ],
  );

  const { data: currentSubscription } = await supabase
    .from("subscriptions")
    .select("id,status,current_period_start,current_period_end")
    .eq("user_id", userId)
    .in("status", ["active", "trialing", "past_due"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: usagePeriods } =
    currentSubscription?.current_period_start &&
    currentSubscription?.current_period_end &&
    Date.parse(currentSubscription.current_period_start) <= Date.parse(now) &&
    Date.parse(currentSubscription.current_period_end) > Date.parse(now) &&
    Date.parse(currentSubscription.current_period_start) <= Date.parse(now) &&
    Date.parse(currentSubscription.current_period_end) > Date.parse(now)
      ? await supabase
          .from("membership_usage_periods")
          .select("report_count,report_limit")
          .eq("user_id", userId)
          .eq("subscription_id", currentSubscription.id)
          .eq("period_start", currentSubscription.current_period_start)
          .eq("period_end", currentSubscription.current_period_end)
          .limit(1)
      : { data: null };

  return summarizeEntitlements({
    caseEntitlement: caseEntitlements?.[0] ?? null,
    membership:
      memberships?.[0] &&
      currentSubscription &&
      memberships[0].source_type === "subscription" &&
      memberships[0].source_id === currentSubscription.id &&
      usagePeriods?.[0]
        ? {
            ...memberships[0],
            usage_limit: usagePeriods[0].report_limit,
            usage_count: usagePeriods[0].report_count,
          }
        : null,
  });
}

export async function getSubscriptionSummary(
  userId: string,
): Promise<SubscriptionSummary> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select(
      "status,current_period_end,cancel_at_period_end,provider_customer_id",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return {
    status: data.status,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end,
    providerCustomerId: data.provider_customer_id,
  };
}
