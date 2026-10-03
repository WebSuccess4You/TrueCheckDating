import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/202606180005_build07_profile_checks.sql",
  ),
  "utf8",
);

describe("Build 07 profile check migration", () => {
  it("creates owner-scoped profile check storage", () => {
    expect(migration).toContain(
      "create table if not exists public.profile_checks",
    );
    expect(migration).toContain(
      "case_id uuid not null references public.cases",
    );
    expect(migration).toContain(
      "auth_user_id uuid not null references auth.users",
    );
    expect(migration).toContain("unique (case_id)");
  });

  it("keeps normal users read-only with RLS", () => {
    expect(migration).toContain(
      "alter table public.profile_checks enable row level security",
    );
    expect(migration).toContain(
      "grant select on table public.profile_checks to authenticated",
    );
    expect(migration).not.toContain("grant insert");
    expect(migration).not.toContain("grant update");
    expect(migration).not.toContain("grant delete");
  });

  it("documents that trusted server code writes the records", () => {
    expect(migration).toContain("Written by trusted server code");
  });
});
