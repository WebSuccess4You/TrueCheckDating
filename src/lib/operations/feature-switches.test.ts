import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { featureEnabled } from "./feature-switches";

describe("emergency feature switches", () => {
  it("preserves normal behavior when unset or explicitly enabled", () => {
    expect(featureEnabled(undefined)).toBe(true);
    expect(featureEnabled("true")).toBe(true);
  });

  it("pauses a feature when false or configured incorrectly", () => {
    expect(featureEnabled("false")).toBe(false);
    expect(featureEnabled(" FALSE ")).toBe(false);
    expect(featureEnabled("enabled")).toBe(false);
    expect(featureEnabled("")).toBe(false);
  });

  it("checks switches before AI or checkout side effects", () => {
    const analysis = readFileSync(
      join(process.cwd(), "src/app/analysis-actions.ts"),
      "utf8",
    );
    const payment = readFileSync(
      join(process.cwd(), "src/app/payment-actions.ts"),
      "utf8",
    );
    expect(analysis.indexOf("if (!chatAnalysisEnabled())")).toBeGreaterThan(0);
    expect(analysis.indexOf("if (!chatAnalysisEnabled())")).toBeLessThan(
      analysis.indexOf("admin.rpc("),
    );
    expect(payment.indexOf("if (!checkoutEnabled())")).toBeGreaterThan(0);
    expect(payment.indexOf("if (!checkoutEnabled())")).toBeLessThan(
      payment.indexOf("getOrCreateStripeCustomer(user.id"),
    );
  });
});
