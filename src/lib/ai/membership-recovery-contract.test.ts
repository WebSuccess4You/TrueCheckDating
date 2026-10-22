import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/202610120004_build17_analysis_reservation_recovery.sql",
  "utf8",
);

describe("Build 17 analysis reservation recovery", () => {
  it("uses the existing user-level advisory lock", () => {
    expect(migration).toContain(
      "pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 202606180013))",
    );
  });

  it("checks lease expiration and processing status before recovery", () => {
    expect(migration).toContain("lease_expires_at < pg_catalog.now()");
    expect(migration).toContain("a.status = 'processing'");
  });

  it("restricts recovery execution to service_role", () => {
    expect(migration).toMatch(
      /revoke all on function public\.recover_expired_membership_analysis_reservations\([^;]+from public, anon, authenticated;/i,
    );
    expect(migration).toMatch(
      /grant execute on function public\.recover_expired_membership_analysis_reservations\([^;]+to service_role;/i,
    );
  });
});
