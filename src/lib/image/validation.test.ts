import { describe, expect, it } from "vitest";

import { imageCheckFormSchema, safeSourceUrlSchema } from "./validation";

const base = {
  caseId: "00000000-0000-4000-8000-000000000001",
  intent: "complete",
  resultCategory: "unclear",
  sourceLink1: "",
  sourceLink2: "",
  sourceLink3: "",
  notes: "",
  safetyAcknowledged: true,
};

describe("safeSourceUrlSchema", () => {
  it("accepts ordinary http and https links", () => {
    expect(
      safeSourceUrlSchema.safeParse("https://example.com/page").success,
    ).toBe(true);
    expect(
      safeSourceUrlSchema.safeParse("http://example.org/image").success,
    ).toBe(true);
  });

  it("rejects unsafe and non-web URL schemes", () => {
    for (const value of [
      "javascript:alert(1)",
      "data:text/html,test",
      "file:///tmp/photo.jpg",
      "ftp://example.com/photo.jpg",
    ]) {
      expect(safeSourceUrlSchema.safeParse(value).success).toBe(false);
    }
  });

  it("rejects embedded credentials", () => {
    expect(
      safeSourceUrlSchema.safeParse("https://user:pass@example.com/page")
        .success,
    ).toBe(false);
  });
});

describe("imageCheckFormSchema", () => {
  it("allows an unavailable image check without a category or acknowledgement", () => {
    expect(
      imageCheckFormSchema.safeParse({
        ...base,
        intent: "unavailable",
        resultCategory: "",
        safetyAcknowledged: false,
      }).success,
    ).toBe(true);
  });
  it("requires a result category to complete the check", () => {
    const parsed = imageCheckFormSchema.safeParse({
      ...base,
      resultCategory: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("requires the anti-harassment safety acknowledgement to complete", () => {
    const parsed = imageCheckFormSchema.safeParse({
      ...base,
      safetyAcknowledged: false,
    });

    expect(parsed.success).toBe(false);
  });

  it("allows incomplete progress to be saved without a category", () => {
    const parsed = imageCheckFormSchema.safeParse({
      ...base,
      intent: "save",
      resultCategory: "",
      safetyAcknowledged: false,
    });

    expect(parsed.success).toBe(true);
  });
});
