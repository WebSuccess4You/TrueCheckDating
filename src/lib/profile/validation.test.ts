import { describe, expect, it } from "vitest";

import { PROFILE_NOTES_MAX_CHARACTERS, profileQuestions } from "./constants";
import { profileCheckFormSchema } from "./validation";

describe("profileCheckFormSchema", () => {
  it("allows saving partial progress", () => {
    const parsed = profileCheckFormSchema.safeParse({
      caseId: "00000000-0000-4000-8000-000000000001",
      intent: "save",
      nameConsistency: "consistent",
    });

    expect(parsed.success).toBe(true);
  });

  it("requires every answer when completing", () => {
    const parsed = profileCheckFormSchema.safeParse({
      caseId: "00000000-0000-4000-8000-000000000001",
      intent: "complete",
      nameConsistency: "consistent",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors as Record<
        string,
        string[] | undefined
      >;
      expect(fieldErrors.ageConsistency?.[0]).toContain("Unknown");
    }
  });

  it("accepts a completed check with unknown answers", () => {
    const answers = Object.fromEntries(
      profileQuestions.map((question) => [question.key, "unknown"]),
    );
    const parsed = profileCheckFormSchema.safeParse({
      caseId: "00000000-0000-4000-8000-000000000001",
      intent: "complete",
      ...answers,
    });

    expect(parsed.success).toBe(true);
  });

  it("limits optional notes", () => {
    const parsed = profileCheckFormSchema.safeParse({
      caseId: "00000000-0000-4000-8000-000000000001",
      intent: "save",
      notes: "x".repeat(PROFILE_NOTES_MAX_CHARACTERS + 1),
    });

    expect(parsed.success).toBe(false);
  });
});
