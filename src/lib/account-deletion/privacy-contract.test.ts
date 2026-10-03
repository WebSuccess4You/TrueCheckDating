import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const action = readFileSync(
  join(process.cwd(), "src/app/account-deletion-actions.ts"),
  "utf8",
);
const form = readFileSync(
  join(process.cwd(), "src/components/account/delete-account-form.tsx"),
  "utf8",
);
const authActions = readFileSync(
  join(process.cwd(), "src/app/auth-actions.ts"),
  "utf8",
);
const webhook = readFileSync(
  join(process.cwd(), "src/lib/payments/webhook.ts"),
  "utf8",
);

describe("Build 13 privacy and deletion contract", () => {
  it("reauthenticates, cancels membership, revokes access, and deletes auth", () => {
    expect(action).toContain("signInWithPassword");
    expect(action).toContain("stripe.subscriptions.cancel");
    expect(action).toContain('status: "revoked"');
    expect(action).toContain("admin.auth.admin.deleteUser");
    expect(action).not.toContain("console.log");
  });

  it("requires explicit permanent-deletion confirmation", () => {
    expect(form).toContain("ACCOUNT_DELETION_CONFIRMATION");
    expect(form).toContain("currentPassword");
    expect(form).toContain("consequencesAcknowledged");
  });

  it("blocks non-active accounts and ignores late Stripe events for deleted users", () => {
    expect(authActions).toContain('profile.account_status !== "active"');
    expect(webhook).toContain("if (!existingProfile)");
    expect(webhook).toContain("deleted the account");
  });
});
