import { describe, expect, it } from "vitest";

import { profileQuestions } from "./constants";
import { profileConcernLabel, scoreProfileCheck } from "./scoring";
import type { ProfileAnswers } from "./types";

describe("scoreProfileCheck", () => {
  it("returns no score when every answer is unknown", () => {
    const answers = Object.fromEntries(
      profileQuestions.map((question) => [question.key, "unknown"]),
    ) as ProfileAnswers;

    const result = scoreProfileCheck(answers);

    expect(result.componentScore).toBeNull();
    expect(result.evidenceCompleteness).toBe(0);
    expect(result.summary).toContain("Not enough evidence");
  });

  it("treats missing answers as lower evidence completeness, not automatic risk", () => {
    const result = scoreProfileCheck({
      nameConsistency: "consistent",
      financialRequests: "none",
    });

    expect(result.componentScore).toBe(0);
    expect(result.evidenceCompleteness).toBe(25);
    expect(result.protectiveSignals).toHaveLength(2);
  });

  it("calculates a weighted concern score from answered questions", () => {
    const result = scoreProfileCheck({
      nameConsistency: "major_inconsistency",
      financialRequests: "repeated",
      verificationCooperation: "refuses",
      locationConsistency: "minor_inconsistency",
    });

    expect(result.componentScore).toBeGreaterThanOrEqual(75);
    expect(result.evidenceCompleteness).toBe(52);
    expect(result.contradictions.map((item) => item.key)).toContain(
      "financialRequests",
    );
  });
});

describe("profileConcernLabel", () => {
  it("maps score ranges to approved labels", () => {
    expect(profileConcernLabel(null)).toBe("Not enough evidence");
    expect(profileConcernLabel(0)).toBe("Low");
    expect(profileConcernLabel(24)).toBe("Low");
    expect(profileConcernLabel(25)).toBe("Moderate");
    expect(profileConcernLabel(50)).toBe("High");
    expect(profileConcernLabel(75)).toBe("Critical");
  });
});
