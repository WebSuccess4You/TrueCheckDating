import { describe, expect, it } from "vitest";

import { chatAnalysisOutputSchema } from "./schema";

const validResult = {
  schema_version: "1.0" as const,
  risk_score: 72,
  concern_level: "high" as const,
  confidence_score: 68,
  confidence_level: "moderate" as const,
  evidence_completeness: 74,
  summary:
    "The conversation contains financial pressure and repeated avoidance of ordinary verification.",
  category_scores: {
    communication_manipulation: 55,
    financial_pressure: 88,
    identity_consistency: 45,
    verification_behavior: 80,
    urgency_and_isolation: 62,
  },
  red_flags: [
    {
      category: "financial_pressure" as const,
      severity: "high" as const,
      evidence_excerpt: "I need the gift cards today",
      observation: "The contact asks for a same-day gift-card transfer.",
      why_it_matters:
        "Gift-card requests reduce recovery options and are common in fraud patterns.",
    },
  ],
  protective_signals: [],
  recommended_actions: [
    {
      priority: "high" as const,
      action: "Do not send gift cards or money.",
      reason: "Independent verification has not occurred.",
    },
  ],
  limitations: ["Text alone cannot establish identity or intent."],
};

describe("chatAnalysisOutputSchema", () => {
  it("accepts a complete structured analysis", () => {
    expect(chatAnalysisOutputSchema.parse(validResult)).toEqual(validResult);
  });

  it("rejects scores outside 0 through 100", () => {
    expect(() =>
      chatAnalysisOutputSchema.parse({ ...validResult, risk_score: 101 }),
    ).toThrow();
  });

  it("rejects unknown fields", () => {
    expect(() =>
      chatAnalysisOutputSchema.parse({
        ...validResult,
        definite_scammer: true,
      }),
    ).toThrow();
  });

  it("requires at least one limitation and one recommendation", () => {
    expect(() =>
      chatAnalysisOutputSchema.parse({
        ...validResult,
        limitations: [],
        recommended_actions: [],
      }),
    ).toThrow();
  });
});
