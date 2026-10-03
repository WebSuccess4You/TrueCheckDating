import { describe, expect, it } from "vitest";

import { signupSchema, updatePasswordSchema } from "./validation";

describe("authentication validation", () => {
  it("accepts a strong password and required consent", () => {
    const result = signupSchema.safeParse({
      email: "person@example.com",
      password: "LongPrivate9Pass",
      confirmPassword: "LongPrivate9Pass",
      adultConfirmed: "on",
      termsAccepted: "on",
      privacyAccepted: "on",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing consent and a weak password", () => {
    const result = signupSchema.safeParse({
      email: "person@example.com",
      password: "password",
      confirmPassword: "password",
      adultConfirmed: "",
      termsAccepted: "",
      privacyAccepted: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched replacement passwords", () => {
    const result = updatePasswordSchema.safeParse({
      password: "LongPrivate9Pass",
      confirmPassword: "DifferentPrivate9Pass",
    });
    expect(result.success).toBe(false);
  });
});
