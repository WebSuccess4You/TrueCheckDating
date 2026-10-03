import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202606180010_build12_reports.sql"),
  "utf8",
);

describe("Build 12 reports migration", () => {
  it("creates owner-readable, server-written versioned report snapshots", () => {
    expect(migration).toContain("create table if not exists public.reports");
    expect(migration).toContain("report_version_number");
    expect(migration).toContain("report_body jsonb not null");
    expect(migration).toContain(
      "alter table public.reports enable row level security",
    );
    expect(migration).toContain(
      "grant select on table public.reports to authenticated",
    );
    expect(migration).toContain("Users can read reports for their own cases");
    expect(migration).not.toContain(
      "grant insert on table public.reports to authenticated",
    );
  });
});
