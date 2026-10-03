import { describe, expect, it } from "vitest";

import { scoreVideoCheck, videoConcernLabel } from "./scoring";

const protectiveAnswers = {
  liveCallStatus: "multiple_clear_calls",
  avoidancePattern: "none",
  liveMovementAndAudio: "natural_live",
  simpleLiveVerification: "completed",
  cameraProblemPattern: "none",
  financialPressureAroundCalls: "none",
  appearanceAndClaims: "consistent",
  boundaryRespect: "respected",
};

describe("scoreVideoCheck", () => {
  it("returns no score when no observed answers are available", () => {
    const result = scoreVideoCheck({
      liveCallStatus: "not_requested",
      avoidancePattern: "unknown",
    });
    expect(result.componentScore).toBeNull();
    expect(result.evidenceCompleteness).toBe(0);
  });

  it("scores complete protective observations as low concern", () => {
    const result = scoreVideoCheck(protectiveAnswers);
    expect(result.componentScore).toBe(0);
    expect(result.evidenceCompleteness).toBe(90);
    expect(result.protectiveSignals.length).toBeGreaterThan(3);
    expect(result.avoidancePatterns).toHaveLength(0);
  });

  it("applies a critical floor when several severe signals are recorded", () => {
    const result = scoreVideoCheck({
      liveCallStatus: "requested_repeatedly_avoided",
      avoidancePattern: "changing_excuses",
      liveMovementAndAudio: "prerecorded_or_out_of_sync",
      simpleLiveVerification: "refused_or_hostile",
      financialPressureAroundCalls: "urgent_or_threatening",
    });
    expect(result.componentScore).toBeGreaterThanOrEqual(75);
    expect(result.severeConcernCount).toBeGreaterThanOrEqual(2);
    expect(result.avoidancePatterns.length).toBeGreaterThanOrEqual(4);
  });

  it("adds note completeness without allowing more than 100", () => {
    const result = scoreVideoCheck({
      ...protectiveAnswers,
      notes:
        "A clear call occurred on two separate dates and no money was requested.",
    });
    expect(result.evidenceCompleteness).toBe(100);
  });

  it("uses the approved concern bands", () => {
    expect(videoConcernLabel(0)).toBe("Low");
    expect(videoConcernLabel(25)).toBe("Moderate");
    expect(videoConcernLabel(50)).toBe("High");
    expect(videoConcernLabel(75)).toBe("Critical");
    expect(videoConcernLabel(null)).toBe("Not enough evidence");
  });
});
