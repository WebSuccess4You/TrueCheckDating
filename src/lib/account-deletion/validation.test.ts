import { describe, expect, it } from "vitest";

import { ACCOUNT_DELETION_CONFIRMATION } from "./constants";
import { accountDeletionSchema } from "./validation";

const valid = {
  currentPassword: "ExamplePassword123",
  confirmation: ACCOUNT_DELETION_CONFIRMATION,
  consequencesAcknowledged: "on",
};

describe("accountDeletionSchema", () => {
  it("requires password reauthentication and the exact confirmation phrase", () => {
    expect(accountDeletionSchema.safeParse(valid).success).toBe(true);
    expect(
      accountDeletionSchema.safeParse({ ...valid, currentPassword: "" })
        .success,
    ).toBe(false);
    expect(
      accountDeletionSchema.safeParse({ ...valid, confirmation: "delete" })
        .success,
    ).toBe(false);
  });

  it("requires permanent-deletion acknowledgement", () => {
    expect(
      accountDeletionSchema.safeParse({
        ...valid,
        consequencesAcknowledged: "",
      }).success,
    ).toBe(false);
  });
});
