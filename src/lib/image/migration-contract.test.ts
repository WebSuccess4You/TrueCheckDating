import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/202606180006_build08_image_checks.sql",
  ),
  "utf8",
);

describe("Build 08 image check migration", () => {
  it("creates owner-scoped image check storage", () => {
    expect(migration).toContain(
      "create table if not exists public.image_checks",
    );
    expect(migration).toContain(
      "case_id uuid not null references public.cases",
    );
    expect(migration).toContain(
      "auth_user_id uuid not null references auth.users",
    );
    expect(migration).toContain("unique (case_id)");
  });

  it("stores private notes as encrypted fields rather than plaintext", () => {
    expect(migration).toContain("notes_ciphertext text");
    expect(migration).toContain("notes_iv text");
    expect(migration).not.toContain("notes text");
  });

  it("keeps normal users read-only with RLS", () => {
    expect(migration).toContain(
      "alter table public.image_checks enable row level security",
    );
    expect(migration).toContain(
      "grant select on table public.image_checks to authenticated",
    );
    expect(migration).not.toContain("grant insert");
    expect(migration).not.toContain("grant update");
    expect(migration).not.toContain("grant delete");
  });

  it("documents that links are user supplied and not verified", () => {
    expect(migration).toContain("not independently verified");
  });
});
