import { describe, expect, it } from "vitest";

import { accountStatusChangeSchema, supportLookupSchema } from "./validation";

const userId = "11111111-1111-4111-8111-111111111111";

describe("Build 14 administration validation", () => {
  it("requires an exact email or user ID for support lookup", () => {
    expect(supportLookupSchema.safeParse({}).success).toBe(false);
    expect(
      supportLookupSchema.safeParse({ email: "person@example.com" }).success,
    ).toBe(true);
    expect(supportLookupSchema.safeParse({ userId }).success).toBe(true);
    expect(
      supportLookupSchema.safeParse({ email: "not-an-email" }).success,
    ).toBe(false);
  });

  it("limits elevated account actions to approved states and reason codes", () => {
    expect(
      accountStatusChangeSchema.safeParse({
        targetUserId: userId,
        nextStatus: "suspended",
        reasonCode: "abuse_prevention",
      }).success,
    ).toBe(true);
    expect(
      accountStatusChangeSchema.safeParse({
        targetUserId: userId,
        nextStatus: "deleted",
        reasonCode: "free text private detail",
      }).success,
    ).toBe(false);
  });
});
