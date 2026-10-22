import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/202610120001_build17_membership_usage_limits.sql",
  ),
  "utf8",
);

describe("Build 17 atomic subscription synchronization", () => {
  it("defines a dedicated subscription synchronization function", () => {
    expect(migration).toContain(
      "create or replace function public.synchronize_membership_subscription(",
    );
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
  });

  it("verifies subscription ownership before updating", () => {
    expect(migration).toContain(
      "provider_subscription_id = p_provider_subscription_id",
    );
    expect(migration).toContain("v_subscription.user_id <> p_user_id");
  });

  it("verifies the Stripe customer belongs to the subscription owner", () => {
    expect(migration).toContain("from public.payment_customers");
    expect(migration).toContain(
      "provider_customer_id = p_provider_customer_id",
    );
    expect(migration).toContain("user_id = p_user_id");
  });
  it("protects against older billing periods", () => {
    expect(migration).toContain(
      "p_period_start < v_subscription.current_period_start",
    );
  });

  it("tracks Stripe event timestamps for ordering checks", () => {
    expect(migration).toContain("last_stripe_event_created");
    expect(migration).toContain("p_event_created");
  });

  it("preserves existing entitlement usage counters during synchronization", () => {
    const update = migration.slice(
      migration.indexOf(
        "on conflict (source_type, source_id, entitlement_type)",
      ),
      migration.indexOf(
        "return v_subscription_id;",
        migration.indexOf(
          "on conflict (source_type, source_id, entitlement_type)",
        ),
      ),
    );

    expect(update).toContain("do update set");
    expect(update).not.toMatch(/usage_count\s*=/);
  });
  it("restricts execution to trusted server-side operations", () => {
    expect(migration).toMatch(
      /revoke all on function public\.synchronize_membership_subscription\(/,
    );
    expect(migration).toMatch(
      /grant execute on function public\.synchronize_membership_subscription\(/,
    );
  });
});

describe("Build 17 Stripe event-ordering safeguards", () => {
  it("allows identical subscription states with matching event timestamps", () => {
    expect(migration).toContain(
      "v_subscription.status is not distinct from p_status",
    );
    expect(migration).toContain(
      "v_subscription.current_period_start is not distinct from p_period_start",
    );
    expect(migration).toContain(
      "v_subscription.current_period_end is not distinct from p_period_end",
    );
    expect(migration).toContain(
      "v_subscription.cancel_at_period_end is not distinct from p_cancel_at_period_end",
    );
  });
  it("rejects ambiguous events sharing the same timestamp", () => {
    expect(migration).toContain(
      "v_subscription.last_stripe_event_created = p_event_created",
    );
    expect(migration).toContain(
      "v_subscription.last_stripe_event_id is distinct from p_event_id",
    );
    expect(migration).toContain(
      "Ambiguous Stripe event ordering; subscription refresh required",
    );
  });
});
