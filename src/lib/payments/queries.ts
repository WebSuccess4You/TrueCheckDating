import "server-only";

import { createClient } from "@/lib/supabase/server";

import { summarizeEntitlements } from "./entitlements";
import type { EntitlementSummary, SubscriptionSummary } from "./types";

export async function getEntitlementSummary(
  userId: string,
  caseId: string,
): Promise<EntitlementSummary> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const [{ data: caseEntitlements }, { data: memberships }] = await Promise.all(
    [
      supabase
        .from("entitlements")
        .select("ends_at,status,usage_limit,usage_count")
        .eq("user_id", userId)
        .eq("case_id", caseId)
        .eq("entitlement_type", "case_full_report")
        .eq("status", "active")
        .or(`ends_at.is.null,ends_at.gt.${now}`)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("entitlements")
        .select("ends_at,status,usage_limit,usage_count")
        .eq("user_id", userId)
        .is("case_id", null)
        .eq("entitlement_type", "membership")
        .eq("status", "active")
        .or(`ends_at.is.null,ends_at.gt.${now}`)
        .order("created_at", { ascending: false })
        .limit(1),
    ],
  );

  return summarizeEntitlements({
    caseEntitlement: caseEntitlements?.[0] ?? null,
    membership: memberships?.[0] ?? null,
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
