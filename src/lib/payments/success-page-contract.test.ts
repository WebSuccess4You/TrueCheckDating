import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const page = readFileSync(
  join(process.cwd(), "src/app/billing/success/page.tsx"),
  "utf8",
);

describe("billing success page", () => {
  it("checks server-side entitlements instead of granting access", () => {
    expect(page).toContain("getEntitlementSummary");
    expect(page).toContain("cannot grant access by");
    expect(page).not.toContain('from("entitlements").insert');
    expect(page).not.toContain("createAdminClient");
  });
});
