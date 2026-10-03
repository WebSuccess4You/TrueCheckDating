import { describe, expect, it } from "vitest";

import {
  checkoutRequestSchema,
  safeInternalCaseResultsPath,
} from "./validation";

const caseId = "00000000-0000-4000-8000-000000000011";

describe("checkoutRequestSchema", () => {
  it("accepts a case-scoped one-time report", () => {
    expect(
      checkoutRequestSchema.safeParse({
        productCode: "one_time_report",
        caseId,
      }).success,
    ).toBe(true);
  });

  it("requires a case for a one-time report", () => {
    expect(
      checkoutRequestSchema.safeParse({ productCode: "one_time_report" })
        .success,
    ).toBe(false);
  });

  it("allows a membership without a case", () => {
    expect(
      checkoutRequestSchema.safeParse({
        productCode: "monthly_membership",
      }).success,
    ).toBe(true);
  });

  it("rejects unknown products", () => {
    expect(
      checkoutRequestSchema.safeParse({ productCode: "lifetime_plan" }).success,
    ).toBe(false);
  });
});

describe("safeInternalCaseResultsPath", () => {
  it("returns an owner-facing result path only for a UUID", () => {
    expect(safeInternalCaseResultsPath(caseId)).toBe(
      `/cases/${caseId}/results`,
    );
    expect(safeInternalCaseResultsPath("https://evil.example")).toBe(
      "/dashboard",
    );
  });
});
