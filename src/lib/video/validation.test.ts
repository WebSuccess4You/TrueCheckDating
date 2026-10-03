import { describe, expect, it } from "vitest";

import { videoQuestions } from "./constants";
import { videoCheckFormSchema } from "./validation";

const completed = Object.fromEntries(
  videoQuestions.map((question) => [question.key, question.options[0].value]),
);

describe("videoCheckFormSchema", () => {
  it("allows partial progress to be saved", () => {
    const result = videoCheckFormSchema.safeParse({
      caseId: "11111111-1111-4111-8111-111111111111",
      intent: "save",
      liveCallStatus: "one_clear_call",
      safetyAcknowledged: false,
    });
    expect(result.success).toBe(true);
  });

  it("requires all checklist answers when completing", () => {
    const result = videoCheckFormSchema.safeParse({
      caseId: "11111111-1111-4111-8111-111111111111",
      intent: "complete",
      liveCallStatus: "one_clear_call",
      safetyAcknowledged: true,
    });
    expect(result.success).toBe(false);
  });

  it("requires the safety acknowledgement when completing", () => {
    const result = videoCheckFormSchema.safeParse({
      caseId: "11111111-1111-4111-8111-111111111111",
      intent: "complete",
      ...completed,
      safetyAcknowledged: false,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a complete valid check", () => {
    const result = videoCheckFormSchema.safeParse({
      caseId: "11111111-1111-4111-8111-111111111111",
      intent: "complete",
      ...completed,
      safetyAcknowledged: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects oversized private notes", () => {
    const result = videoCheckFormSchema.safeParse({
      caseId: "11111111-1111-4111-8111-111111111111",
      intent: "save",
      notes: "x".repeat(2001),
      safetyAcknowledged: false,
    });
    expect(result.success).toBe(false);
  });
});
