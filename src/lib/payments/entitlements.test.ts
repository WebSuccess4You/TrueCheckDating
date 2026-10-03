import { describe, expect, it } from "vitest";

import { isEntitlementCurrent, summarizeEntitlements } from "./entitlements";

const now = Date.parse("2026-06-18T12:00:00.000Z");
const active = {
  ends_at: "2026-07-18T12:00:00.000Z",
  status: "active",
  usage_limit: 3,
  usage_count: 1,
};

describe("entitlement status", () => {
  it("accepts active unexpired access", () => {
    expect(isEntitlementCurrent(active, now)).toBe(true);
  });

  it("rejects expired, revoked, and inactive access", () => {
    expect(
      isEntitlementCurrent({ ...active, ends_at: "2026-05-01T00:00:00Z" }, now),
    ).toBe(false);
    expect(isEntitlementCurrent({ ...active, status: "revoked" }, now)).toBe(
      false,
    );
    expect(isEntitlementCurrent({ ...active, status: "inactive" }, now)).toBe(
      false,
    );
  });

  it("prefers a case purchase over membership access", () => {
    const summary = summarizeEntitlements({
      caseEntitlement: active,
      membership: { ...active, usage_limit: 20 },
      now,
    });
    expect(summary.hasFullReportAccess).toBe(true);
    expect(summary.source).toBe("case_purchase");
    expect(summary.usageLimit).toBe(3);
  });

  it("uses an active membership when no case purchase exists", () => {
    const summary = summarizeEntitlements({
      caseEntitlement: null,
      membership: { ...active, usage_limit: 20 },
      now,
    });
    expect(summary.source).toBe("membership");
    expect(summary.usageLimit).toBe(20);
  });

  it("does not grant access from expired records", () => {
    const expired = { ...active, ends_at: "2026-01-01T00:00:00Z" };
    const summary = summarizeEntitlements({
      caseEntitlement: expired,
      membership: expired,
      now,
    });
    expect(summary.hasFullReportAccess).toBe(false);
    expect(summary.source).toBeNull();
  });
});
