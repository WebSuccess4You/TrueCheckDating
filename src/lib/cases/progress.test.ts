import { describe, expect, it } from "vitest";

import { calculateCheckCompletion } from "./progress";

describe("case check completion", () => {
  it.each(Array.from({ length: 16 }, (_, mask) => mask))(
    "counts actual completed checks for combination %i",
    (mask) => {
      const completed = { status: "completed" };
      expect(
        calculateCheckCompletion(
          mask & 1 ? { status: "analysis_completed" } : null,
          mask & 2 ? completed : null,
          mask & 4
            ? { status: "completed", result_category: "same_identity" }
            : null,
          mask & 8 ? completed : null,
        ),
      ).toBe([1, 2, 4, 8].filter((bit) => mask & bit).length * 25);
    },
  );

  it("does not count an unclear image result", () => {
    expect(
      calculateCheckCompletion(
        null,
        null,
        { status: "completed", result_category: "unclear" },
        null,
      ),
    ).toBe(0);
  });

  it("shows 75 percent when chat is saved but the other checks are completed", () => {
    expect(
      calculateCheckCompletion(
        { status: "ready_for_analysis" },
        { status: "completed" },
        { status: "completed", result_category: "same_identity" },
        { status: "completed" },
      ),
    ).toBe(75);
  });
});
