import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/202606180004_build06_chat_analyses.sql",
  ),
  "utf8",
);

describe("Build 06 migration contract", () => {
  it("creates structured analysis and prompt-version tables", () => {
    expect(migration).toContain(
      "create table if not exists public.chat_analyses",
    );
    expect(migration).toContain(
      "create table if not exists public.prompt_versions",
    );
    expect(migration).toContain("prompt_version text not null");
    expect(migration).toContain("schema_version text not null");
  });

  it("allows authenticated users to read only their own analyses", () => {
    expect(migration).toContain(
      "alter table public.chat_analyses enable row level security",
    );
    expect(migration).toContain(
      'policy "Users can read analyses for their own chat submissions"',
    );
    expect(migration).toContain("(select auth.uid()) = auth_user_id");
  });

  it("does not grant authenticated users insert or update permission", () => {
    expect(migration).toContain(
      "revoke all on table public.chat_analyses from authenticated",
    );
    expect(migration).toContain(
      "grant select on table public.chat_analyses to authenticated",
    );
    expect(migration).not.toMatch(/grant\s+insert[\s\S]+chat_analyses/i);
    expect(migration).not.toMatch(/grant\s+update[\s\S]+chat_analyses/i);
  });

  it("prevents two active analyses for one submission", () => {
    expect(migration).toContain("chat_analyses_one_active_per_submission_idx");
    expect(migration).toContain("where status in ('queued', 'processing')");
  });

  it("requires complete fields before an analysis can be marked completed", () => {
    expect(migration).toContain("chat_analyses_completed_fields_check");
    expect(migration).toContain("status <> 'completed'");
    expect(migration).toContain("risk_score is not null");
    expect(migration).toContain("limitations is not null");
  });
});
