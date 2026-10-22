import { describe, expect, it } from "vitest";

import { isEntitlementCurrent, summarizeEntitlements } from "./entitlements";

const now = Date.parse("2026-06-18T12:00:00.000Z");
const active = {
  ends_at: "2026-07-18T12:00:00.000Z",
  status: "active",
  usage_limit: 4,
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
    expect(summary.usageLimit).toBe(4);
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

describe("four-report purchase allowance", () => {
  it.each([0, 1, 2, 3])(
    "retains an active purchase after %i report generations",
    (usageCount) => {
      const entitlement = {
        ...active,
        usage_limit: 4,
        usage_count: usageCount,
      };

      expect(isEntitlementCurrent(entitlement, now)).toBe(true);
      expect(entitlement.usage_count < entitlement.usage_limit).toBe(true);
    },
  );

  it("has no remaining allowance after four report generations", () => {
    const entitlement = {
      ...active,
      usage_limit: 4,
      usage_count: 4,
    };

    expect(entitlement.usage_count >= entitlement.usage_limit).toBe(true);
  });

  it("expires at the end of the purchased period", () => {
    const expiresAt = Date.parse(active.ends_at);

    expect(
      isEntitlementCurrent({ ...active, usage_limit: 4 }, expiresAt - 1),
    ).toBe(true);

    expect(isEntitlementCurrent({ ...active, usage_limit: 4 }, expiresAt)).toBe(
      false,
    );
  });
});

describe("Build 17 membership fallback", () => {
  it("uses membership when an active individual purchase is exhausted", () => {
    const summary = summarizeEntitlements({
      caseEntitlement: {
        ...active,
        usage_limit: 4,
        usage_count: 4,
      },
      membership: {
        ...active,
        usage_limit: 20,
        usage_count: 6,
      },
      now,
    });

    expect(summary.hasFullReportAccess).toBe(true);
    expect(summary.source).toBe("membership");
    expect(summary.usageLimit).toBe(20);
    expect(summary.usageCount).toBe(6);
  });
});
