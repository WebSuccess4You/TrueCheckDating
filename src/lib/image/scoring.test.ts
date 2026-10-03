import { describe, expect, it } from "vitest";

import { imageConcernLabel, scoreImageCheck } from "./scoring";

describe("scoreImageCheck", () => {
  it("excludes an inconclusive search from scoring", () => {
    const result = scoreImageCheck("unclear", [], null);
    expect(result.componentScore).toBeNull();
    expect(result.evidenceCompleteness).toBe(0);
    expect(result.classification).toBe("unavailable");
  });
  it("returns no score when no result category has been recorded", () => {
    const result = scoreImageCheck(null, [], null);

    expect(result.componentScore).toBeNull();
    expect(result.evidenceCompleteness).toBe(0);
    expect(result.classification).toBe("unavailable");
  });

  it("treats no meaningful match as limited neutral evidence", () => {
    const result = scoreImageCheck("no_meaningful_match", [], null);

    expect(result.componentScore).toBe(20);
    expect(result.evidenceCompleteness).toBe(70);
    expect(result.classification).toBe("neutral");
    expect(result.summary).toContain("does not confirm");
  });

  it("treats a consistent same-identity source as a protective signal", () => {
    const result = scoreImageCheck(
      "same_identity_match",
      ["https://example.com/profile"],
      "The page has an established history under the same name.",
    );

    expect(result.componentScore).toBe(10);
    expect(result.evidenceCompleteness).toBe(90);
    expect(result.classification).toBe("protective");
  });

  it("scores a stock or public image as a critical concern", () => {
    const result = scoreImageCheck(
      "stock_or_public_image",
      ["https://example.com/stock", "https://example.org/article"],
      "The exact photograph appears in a commercial stock collection.",
    );

    expect(result.componentScore).toBe(95);
    expect(result.evidenceCompleteness).toBe(100);
    expect(result.classification).toBe("concern");
  });
});

describe("imageConcernLabel", () => {
  it("maps score ranges to the approved concern labels", () => {
    expect(imageConcernLabel(null)).toBe("Not enough evidence");
    expect(imageConcernLabel(24)).toBe("Low");
    expect(imageConcernLabel(25)).toBe("Moderate");
    expect(imageConcernLabel(50)).toBe("High");
    expect(imageConcernLabel(75)).toBe("Critical");
  });
});
