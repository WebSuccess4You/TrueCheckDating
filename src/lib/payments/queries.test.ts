import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createClient: vi.fn(), from: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.createClient }));

import { summarizeEntitlements } from "./entitlements";
import { getEntitlementSummary } from "./queries";

function mockQuery(data: unknown) {
  const query: Record<string, unknown> = {};
  for (const method of [
    "select",
    "eq",
    "in",
    "is",
    "or",
    "order",
    "limit",
    "maybeSingle",
  ]) {
    query[method] = vi.fn().mockReturnValue(query);
  }
  query.maybeSingle = vi.fn().mockResolvedValue({
    data: Array.isArray(data) ? (data[0] ?? null) : data,
    error: null,
  });
  query.then = (resolve: (value: unknown) => void) =>
    Promise.resolve({ data, error: null }).then(resolve);
  return query;
}

describe("Build 17 entitlement query regression", () => {
  it("preserves the four-report individual purchase allowance", () => {
    const summary = summarizeEntitlements({
      caseEntitlement: {
        status: "active",
        ends_at: "2026-12-01T00:00:00.000Z",
        usage_limit: 4,
        usage_count: 2,
      },
      membership: null,
      now: Date.parse("2026-10-17T12:00:00.000Z"),
    });

    expect(summary.hasFullReportAccess).toBe(true);
    expect(summary.source).toBe("case_purchase");
    expect(summary.usageLimit).toBe(4);
    expect(summary.usageCount).toBe(2);
  });
  it("uses membership allowance after an individual purchase is exhausted", () => {
    const summary = summarizeEntitlements({
      caseEntitlement: {
        status: "active",
        ends_at: "2026-12-01T00:00:00.000Z",
        usage_limit: 4,
        usage_count: 4,
      },
      membership: {
        status: "active",
        ends_at: "2026-11-13T00:00:00.000Z",
        usage_limit: 20,
        usage_count: 3,
      },
      now: Date.parse("2026-10-17T12:00:00.000Z"),
    });

    expect(summary.hasFullReportAccess).toBe(true);
    expect(summary.source).toBe("membership");
    expect(summary.usageLimit).toBe(20);
    expect(summary.usageCount).toBe(3);
  });
});
describe("Build 17 membership database query", () => {
  it("reads the current billing period's report allowance", async () => {
    const currentStart = "2026-10-13T00:00:00.000Z";
    const currentEnd = "2026-11-13T00:00:00.000Z";

    let entitlementCalls = 0;
    mocks.from.mockImplementation((table: string) => {
      if (table === "entitlements" && ++entitlementCalls === 1)
        return mockQuery([
          {
            status: "active",
            ends_at: "2026-11-13T00:00:00.000Z",
            usage_limit: 4,
            usage_count: 4,
            source_type: "subscription",
            source_id: "subscription-1",
          },
        ]);
      if (table === "entitlements")
        return mockQuery([
          {
            status: "active",
            ends_at: "2026-11-13T00:00:00.000Z",
            usage_limit: 20,
            usage_count: 0,
            source_type: "subscription",
            source_id: "subscription-1",
          },
        ]);
      if (table === "subscriptions")
        return mockQuery([
          {
            id: "subscription-1",
            user_id: "user-1",
            status: "active",
            current_period_start: currentStart,
            current_period_end: currentEnd,
          },
        ]);
      if (table === "membership_usage_periods")
        return mockQuery([
          {
            subscription_id: "subscription-1",
            user_id: "user-1",
            period_start: currentStart,
            period_end: currentEnd,
            report_count: 3,
            report_limit: 20,
          },
        ]);
      throw new Error(`Unexpected table: ${table}`);
    });
    mocks.createClient.mockResolvedValue({ from: mocks.from });

    const summary = await getEntitlementSummary("user-1", "case-1");

    expect(mocks.from).toHaveBeenCalledWith("membership_usage_periods");
    expect(summary.source).toBe("membership");
    expect(summary.usageLimit).toBe(20);
    expect(summary.usageCount).toBe(3);
    expect(summary.hasFullReportAccess).toBe(true);
  });
});

it("blocks exhausted membership reports", () => {
  const result = summarizeEntitlements({
    caseEntitlement: null,
    membership: {
      status: "active",
      ends_at: "2026-11-13T00:00:00.000Z",
      usage_limit: 20,
      usage_count: 20,
    },
    now: Date.parse("2026-10-17T12:00:00.000Z"),
  });
  expect(result.hasFullReportAccess).toBe(false);
  expect(result.source).toBeNull();
});

it("rejects a membership linked to a different subscription", async () => {
  const originalFrom = mocks.from.getMockImplementation();
  if (!originalFrom) throw new Error("Membership query mock is missing");
  mocks.from.mockImplementation((table: string) => {
    if (table === "entitlements")
      return mockQuery([
        {
          status: "active",
          ends_at: "2099-01-01T00:00:00.000Z",
          usage_limit: 20,
          usage_count: 0,
          source_type: "subscription",
          source_id: "different-subscription",
        },
      ]);
    if (table === "subscriptions")
      return mockQuery([
        {
          id: "subscription-1",
          status: "active",
          current_period_start: "2026-10-13T00:00:00.000Z",
          current_period_end: "2026-11-13T00:00:00.000Z",
        },
      ]);
    if (table === "membership_usage_periods")
      return mockQuery([{ report_count: 3, report_limit: 20 }]);
    throw new Error(`Unexpected table: ${table}`);
  });
  mocks.createClient.mockResolvedValue({ from: mocks.from });
  const summary = await getEntitlementSummary("user-1");
  expect(summary.hasFullReportAccess).toBe(false);
  expect(summary.source).toBeNull();
});

describe("membership billing-period boundaries", () => {
  it.each([
    ["future", "2026-10-21T12:00:00.000Z", "2026-11-21T12:00:00.000Z", false],
    ["expired", "2026-09-19T12:00:00.000Z", "2026-10-19T12:00:00.000Z", false],
    [
      "exact start",
      "2026-10-20T12:00:00.000Z",
      "2026-11-20T12:00:00.000Z",
      true,
    ],
    [
      "exact end",
      "2026-09-20T12:00:00.000Z",
      "2026-10-20T12:00:00.000Z",
      false,
    ],
  ])("checks the %s boundary", async (_label, start, end, allowed) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-20T12:00:00.000Z"));
    try {
      mocks.from.mockReset();
      mocks.createClient.mockReset();
      mocks.from.mockImplementation((table: string) => {
        if (table === "entitlements")
          return mockQuery([
            {
              status: "active",
              ends_at: "2099-01-01T00:00:00.000Z",
              usage_limit: 20,
              usage_count: 0,
              source_type: "subscription",
              source_id: "subscription-1",
            },
          ]);
        if (table === "subscriptions")
          return mockQuery([
            {
              id: "subscription-1",
              status: "active",
              current_period_start: start,
              current_period_end: end,
            },
          ]);
        if (table === "membership_usage_periods")
          return mockQuery([{ report_count: 3, report_limit: 20 }]);
        throw new Error(`Unexpected table: ${table}`);
      });
      mocks.createClient.mockResolvedValue({ from: mocks.from });

      const summary = await getEntitlementSummary("user-1");

      expect(summary.hasFullReportAccess).toBe(allowed);
      expect(summary.source).toBe(allowed ? "membership" : null);
      if (allowed) {
        expect(mocks.from).toHaveBeenCalledWith("membership_usage_periods");
        expect(summary.usageCount).toBe(3);
      } else {
        expect(mocks.from).not.toHaveBeenCalledWith("membership_usage_periods");
      }
    } finally {
      vi.useRealTimers();
    }
  });
});
