import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/202606180012_build14_admin_support.sql",
  ),
  "utf8",
);

describe("Build 14 administration migration", () => {
  it("creates a server-only sanitized system-error table", () => {
    expect(migration).toContain(
      "create table if not exists public.system_errors",
    );
    expect(migration).toContain(
      "revoke all on table public.system_errors from anon, authenticated",
    );
    expect(migration).not.toContain(
      "grant select on table public.system_errors to authenticated",
    );
  });

  it("supports staff lookup and failure review with indexes", () => {
    expect(migration).toContain("user_profiles_email_normalized_idx");
    expect(migration).toContain("user_profiles_role_status_idx");
    expect(migration).toContain("chat_analyses_failure_review_idx");
  });

  it("documents prohibited private content in error records", () => {
    expect(migration).toContain("must never contain transcripts");
    expect(migration).toContain("private notes");
    expect(migration).toContain("API keys");
  });
});
