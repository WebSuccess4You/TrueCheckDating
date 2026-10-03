import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/202606180008_build10_case_assessments.sql",
  ),
  "utf8",
);

describe("Build 10 case assessment migration", () => {
  it("creates versioned assessment storage", () => {
    expect(migration).toContain(
      "create table if not exists public.case_assessments",
    );
    expect(migration).toContain("scoring_version text not null");
    expect(migration).toContain("source_fingerprints jsonb not null");
  });

  it("enforces valid score and concern ranges", () => {
    expect(migration).toContain("overall_score between 0 and 100");
    expect(migration).toContain("confidence_score between 0 and 100");
    expect(migration).toContain("evidence_completeness between 0 and 100");
    expect(migration).toContain("'Low', 'Moderate', 'High', 'Critical'");
  });

  it("keeps authenticated users read-only with owner-scoped RLS", () => {
    expect(migration).toContain(
      "alter table public.case_assessments enable row level security",
    );
    expect(migration).toContain(
      "grant select on table public.case_assessments to authenticated",
    );
    expect(migration).not.toContain("grant insert");
    expect(migration).not.toContain("grant update");
    expect(migration).not.toContain("grant delete");
    expect(migration).toContain("cases.auth_user_id = (select auth.uid())");
  });

  it("requires preliminary results to contain an overall score and concern level", () => {
    expect(migration).toContain("case_assessments_preliminary_fields_check");
    expect(migration).toContain(
      "overall_score is not null and concern_level is not null",
    );
  });
});
