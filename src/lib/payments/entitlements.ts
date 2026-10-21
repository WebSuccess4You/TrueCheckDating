import type { EntitlementSummary } from "./types";

type EntitlementRecord = {
  ends_at: string | null;
  status: string;
  usage_limit: number | null;
  usage_count: number;
};

export function isEntitlementCurrent(
  record: EntitlementRecord | null | undefined,
  now = Date.now(),
): record is EntitlementRecord {
  if (!record || record.status !== "active") return false;
  return !record.ends_at || new Date(record.ends_at).getTime() > now;
}

export function summarizeEntitlements({
  caseEntitlement,
  membership,
  now = Date.now(),
}: {
  caseEntitlement: EntitlementRecord | null | undefined;
  membership: EntitlementRecord | null | undefined;
  now?: number;
}): EntitlementSummary {
  const activeCaseEntitlement =
    isEntitlementCurrent(caseEntitlement, now) &&
    (caseEntitlement.usage_limit === null ||
      caseEntitlement.usage_count < caseEntitlement.usage_limit)
      ? caseEntitlement
      : null;
  const activeMembership =
    isEntitlementCurrent(membership, now) &&
    (membership.usage_limit === null ||
      membership.usage_count < membership.usage_limit)
      ? membership
      : null;

  return {
    hasFullReportAccess: Boolean(activeCaseEntitlement || activeMembership),
    source: activeCaseEntitlement
      ? "case_purchase"
      : activeMembership
        ? "membership"
        : null,
    caseEntitlementEndsAt: activeCaseEntitlement?.ends_at ?? null,
    membershipStatus: activeMembership?.status ?? null,
    membershipEndsAt: activeMembership?.ends_at ?? null,
    usageLimit:
      activeCaseEntitlement?.usage_limit ??
      activeMembership?.usage_limit ??
      null,
    usageCount:
      activeCaseEntitlement?.usage_count ?? activeMembership?.usage_count ?? 0,
  };
}
