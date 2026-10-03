import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/202606180011_build13_account_deletion.sql",
  ),
  "utf8",
);

describe("Build 13 account deletion migration", () => {
  it("creates a server-only deletion queue and durable status receipt", () => {
    expect(migration).toContain(
      "create table if not exists public.account_deletion_requests",
    );
    expect(migration).toContain("status_token_hash text not null unique");
    expect(migration).toContain("email_hash text not null");
    expect(migration).not.toContain("email text");
    expect(migration).toContain("on delete set null");
  });

  it("creates sanitized audit events that survive account deletion", () => {
    expect(migration).toContain(
      "create table if not exists public.audit_events",
    );
    expect(migration).toContain(
      "actor_user_id uuid references auth.users(id) on delete set null",
    );
    expect(migration).toContain("metadata jsonb not null");
  });

  it("keeps deletion and audit records unavailable to browser roles", () => {
    expect(migration).toContain(
      "alter table public.account_deletion_requests enable row level security",
    );
    expect(migration).toContain(
      "revoke all on table public.account_deletion_requests from anon, authenticated",
    );
    expect(migration).not.toContain(
      "grant select on table public.account_deletion_requests",
    );
  });
});
