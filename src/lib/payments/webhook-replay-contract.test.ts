import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/202606180016_build15_atomic_webhook_reservation.sql",
  ),
  "utf8",
);
const webhook = readFileSync(
  join(process.cwd(), "src/lib/payments/webhook.ts"),
  "utf8",
);

describe("Stripe webhook replay boundary", () => {
  it("claims event IDs atomically and permits retry of failed or stale claims", () => {
    expect(migration).toContain("on conflict (provider_event_id) do nothing");
    expect(migration).toContain("for update");
    expect(migration).toContain("v_record.processing_status = 'completed'");
    expect(migration).toContain("v_record.processing_status = 'processing'");
    expect(migration).toContain("interval '10 minutes'");
    expect(migration).toContain("claim_token = p_claim_token");
    expect(migration).toContain("security definer");
    expect(migration).toMatch(/from public, anon, authenticated;/);
    expect(migration).toMatch(/to service_role;/);
  });

  it("only the claim owner completes or fails an event", () => {
    expect(webhook).toContain('"reserve_stripe_webhook_event"');
    expect(webhook).toContain('.eq("claim_token", claimToken)');
    expect(webhook).toContain(
      'if (error || !data) throw new Error("Could not complete Stripe event claim.")',
    );
  });

  it("never rewrites an existing report allowance count during replay", () => {
    const report = webhook.slice(
      webhook.indexOf("async function fulfillCheckoutSession"),
      webhook.indexOf("async function recordFailedCheckoutSession"),
    );
    const membership = webhook.slice(
      webhook.indexOf("async function synchronizeSubscription"),
      webhook.indexOf("async function handleRefund"),
    );
    expect(report).toContain("existingEntitlement");
    expect(report).not.toContain(".update(entitlementPayload)");
    expect(membership).toContain("usage_count: 0");
    expect(membership).not.toContain("existingEntitlement?.usage_count");
  });
});
