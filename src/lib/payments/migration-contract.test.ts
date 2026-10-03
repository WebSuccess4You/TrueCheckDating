import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/202606180009_build11_payments_entitlements.sql",
  ),
  "utf8",
);

describe("Build 11 payments migration", () => {
  it("creates products, payments, subscriptions, entitlements, and webhook ledger", () => {
    for (const table of [
      "products",
      "payment_customers",
      "payments",
      "subscriptions",
      "entitlements",
      "usage_events",
      "stripe_webhook_events",
    ]) {
      expect(migration).toContain(`create table if not exists public.${table}`);
    }
  });

  it("seeds the approved test prices", () => {
    expect(migration).toContain("'one_time_report'");
    expect(migration).toContain("999");
    expect(migration).toContain("'monthly_membership'");
    expect(migration).toContain("1499");
  });

  it("makes webhook receipt IDs unique for idempotency", () => {
    expect(migration).toContain("provider_event_id text not null unique");
  });

  it("keeps authenticated users read-only", () => {
    expect(migration).toContain(
      "grant select on table public.entitlements to authenticated",
    );
    expect(migration).not.toContain("grant insert on table");
    expect(migration).not.toContain("grant update on table");
    expect(migration).not.toContain("grant delete on table");
  });

  it("does not expose the webhook ledger to authenticated users", () => {
    expect(migration).toContain(
      "revoke all on table public.stripe_webhook_events from anon, authenticated",
    );
    expect(migration).not.toContain(
      "grant select on table public.stripe_webhook_events to authenticated",
    );
  });
});
