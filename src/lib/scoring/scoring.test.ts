import { describe, expect, it } from "vitest";

import {
  calculateCombinedAssessment,
  concernLevel,
  isAssessmentOutdated,
} from "./scoring";
import type { CombinedScoringInput } from "./types";

function input(
  overrides: Partial<CombinedScoringInput> = {},
): CombinedScoringInput {
  return {
    chat: {
      completed: true,
      communicationManipulationScore: 40,
      financialPressureScore: 60,
      urgencyIsolationScore: 40,
      confidenceScore: 80,
      evidenceCompleteness: 80,
      sourceId: "chat-1",
      promptVersion: "prompt-1",
      modelIdentifier: "model-1",
      sourceCompletedAt: "2026-06-18T10:00:00Z",
    },
    profile: {
      completed: true,
      score: 30,
      evidenceCompleteness: 100,
      sourceId: "profile-1",
      sourceVersion: "profile-1",
      sourceUpdatedAt: "2026-06-18T10:00:00Z",
    },
    video: {
      completed: false,
      score: null,
      evidenceCompleteness: 0,
      sourceId: null,
      sourceVersion: null,
      sourceUpdatedAt: null,
    },
    image: {
      completed: false,
      score: null,
      evidenceCompleteness: 0,
      sourceId: null,
      sourceVersion: null,
      sourceUpdatedAt: null,
    },
    ...overrides,
  };
}

describe("calculateCombinedAssessment", () => {
  it("requires completed chat evidence and at least one secondary check", () => {
    const result = calculateCombinedAssessment(
      input({
        profile: {
          completed: false,
          score: null,
          evidenceCompleteness: 0,
          sourceId: null,
          sourceVersion: null,
          sourceUpdatedAt: null,
        },
      }),
    );
    expect(result.ready).toBe(false);
    expect(result.overallScore).toBeNull();
    expect(result.status).toBe("not_ready");
  });

  it("normalizes the score across only available components", () => {
    const result = calculateCombinedAssessment(input());
    expect(result.ready).toBe(true);
    expect(result.availableWeight).toBe(70);
    expect(result.overallScore).toBe(41);
  });

  it("does not treat missing image or video evidence as high risk", () => {
    const withoutMissing = calculateCombinedAssessment(input());
    const withLowChecks = calculateCombinedAssessment(
      input({
        video: {
          completed: true,
          score: 0,
          evidenceCompleteness: 100,
          sourceId: "video-1",
          sourceVersion: "video-1",
          sourceUpdatedAt: "2026-06-18T11:00:00Z",
        },
        image: {
          completed: true,
          score: 0,
          evidenceCompleteness: 100,
          sourceId: "image-1",
          sourceVersion: "image-1",
          sourceUpdatedAt: "2026-06-18T11:00:00Z",
        },
      }),
    );
    expect(withoutMissing.overallScore).toBe(41);
    expect(withLowChecks.overallScore).toBeLessThan(
      withoutMissing.overallScore ?? 0,
    );
  });

  it("uses 35/25/20/20 evidence weights", () => {
    const result = calculateCombinedAssessment(
      input({
        video: {
          completed: true,
          score: 30,
          evidenceCompleteness: 50,
          sourceId: "video-1",
          sourceVersion: "v1",
          sourceUpdatedAt: "2026-06-18T11:00:00Z",
        },
        image: {
          completed: true,
          score: 30,
          evidenceCompleteness: 50,
          sourceId: "image-1",
          sourceVersion: "v1",
          sourceUpdatedAt: "2026-06-18T11:00:00Z",
        },
      }),
    );
    expect(result.evidenceCompleteness).toBe(73);
  });

  it("keeps confidence separate from concern", () => {
    const result = calculateCombinedAssessment(
      input({
        chat: {
          ...input().chat,
          confidenceScore: 20,
          evidenceCompleteness: 30,
        },
        profile: {
          ...input().profile,
          evidenceCompleteness: 20,
        },
      }),
    );
    expect(result.overallScore).not.toBeNull();
    expect(result.confidenceScore).toBeLessThan(40);
    expect(result.confidenceLevel).toBe("Low");
  });

  it("uses the approved concern bands", () => {
    expect(concernLevel(0)).toBe("Low");
    expect(concernLevel(25)).toBe("Moderate");
    expect(concernLevel(50)).toBe("High");
    expect(concernLevel(75)).toBe("Critical");
  });

  it("combines financial pressure and urgency by averaging them", () => {
    const result = calculateCombinedAssessment(input());
    const financial = result.components.find(
      (component) => component.key === "financial_pressure_urgency",
    );
    expect(financial?.score).toBe(50);
  });

  it("records source fingerprints for versioned recalculation", () => {
    const result = calculateCombinedAssessment(input());
    expect(result.sourceFingerprints.chat.id).toBe("chat-1");
    expect(result.sourceFingerprints.profile.version).toBe("profile-1");
  });
});

describe("isAssessmentOutdated", () => {
  it("detects a changed source timestamp", () => {
    const result = calculateCombinedAssessment(input());
    const current = structuredClone(result.sourceFingerprints);
    current.profile.updatedAt = "2026-06-18T12:00:00Z";
    expect(isAssessmentOutdated(result.sourceFingerprints, current)).toBe(true);
  });

  it("returns false for identical source fingerprints", () => {
    const result = calculateCombinedAssessment(input());
    expect(
      isAssessmentOutdated(
        result.sourceFingerprints,
        result.sourceFingerprints,
      ),
    ).toBe(false);
  });
});
