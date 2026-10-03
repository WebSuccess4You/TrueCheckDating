import { describe, expect, it } from "vitest";

import {
  excerptAppearsInTranscript,
  validateEvidenceExcerpts,
} from "./evidence";
import type { ChatAnalysisOutput } from "./schema";

const transcript = `Me: Can we video call tonight?\nContact: My camera is broken again.\nContact: I need the gift cards today.`;

const result: ChatAnalysisOutput = {
  schema_version: "1.0",
  risk_score: 70,
  concern_level: "high",
  confidence_score: 65,
  confidence_level: "moderate",
  evidence_completeness: 72,
  summary:
    "The conversation includes financial pressure and repeated verification avoidance.",
  category_scores: {
    communication_manipulation: 40,
    financial_pressure: 90,
    identity_consistency: 40,
    verification_behavior: 85,
    urgency_and_isolation: 60,
  },
  red_flags: [
    {
      category: "financial_pressure",
      severity: "high",
      evidence_excerpt: "I need the gift cards today.",
      observation: "A same-day gift-card request appears in the transcript.",
      why_it_matters: "Gift cards are difficult to recover after transfer.",
    },
  ],
  protective_signals: [],
  recommended_actions: [
    {
      priority: "high",
      action: "Do not send gift cards.",
      reason: "The request has not been independently verified.",
    },
  ],
  limitations: ["Text alone cannot establish identity or intent."],
};

describe("evidence validation", () => {
  it("accepts exact excerpts even when whitespace differs", () => {
    expect(
      excerptAppearsInTranscript("My camera is broken   again.", transcript),
    ).toBe(true);
  });

  it("accepts typography-only quote and dash differences", () => {
    expect(
      excerptAppearsInTranscript(
        "Taylor: I won't send money - not now.",
        "Taylor: I won’t send money — not now.",
      ),
    ).toBe(true);
  });

  it("rejects a paraphrase even when the meaning is similar", () => {
    expect(
      excerptAppearsInTranscript(
        "Contact: I refuse to do a video call.",
        "Contact: My camera is broken right now.",
      ),
    ).toBe(false);
  });

  it("accepts a correct speaker label prepended to a mid-turn quote", () => {
    const conversation =
      "Alex: Maybe later. I have an urgent bill today. Could you send me $200? Please don’t tell anyone. Taylor: I won’t send money.";
    expect(
      excerptAppearsInTranscript(
        "Alex: Could you send me $200? Please don’t tell anyone.",
        conversation,
      ),
    ).toBe(true);
    expect(
      excerptAppearsInTranscript(
        "Taylor: Could you send me $200? Please don’t tell anyone.",
        conversation,
      ),
    ).toBe(false);
    expect(
      excerptAppearsInTranscript(
        "Alex: Could you send me $2,000? Please don’t tell anyone.",
        conversation,
      ),
    ).toBe(false);
  });

  it("rejects invented evidence", () => {
    expect(
      excerptAppearsInTranscript("Send $5,000 in cryptocurrency", transcript),
    ).toBe(false);
  });

  it("validates all warning and protective excerpts", () => {
    expect(validateEvidenceExcerpts(result, transcript)).toEqual({
      valid: true,
    });
  });

  it("identifies a result containing a fabricated quote", () => {
    const invalid: ChatAnalysisOutput = {
      ...result,
      red_flags: [
        {
          ...result.red_flags[0],
          evidence_excerpt: "Wire the money to my account.",
        },
      ],
    };
    expect(validateEvidenceExcerpts(invalid, transcript)).toEqual({
      valid: false,
      invalidExcerpt: "Wire the money to my account.",
    });
  });
});
