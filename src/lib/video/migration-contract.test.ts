import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const sql = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/202606180007_build09_video_checks.sql",
  ),
  "utf8",
);

describe("Build 09 migration contract", () => {
  it("creates the video check table with ownership and case references", () => {
    expect(sql).toContain("create table if not exists public.video_checks");
    expect(sql).toContain("references public.cases(id) on delete cascade");
    expect(sql).toContain("references auth.users(id) on delete cascade");
    expect(sql).toContain("unique (case_id)");
  });

  it("enables owner-only read access", () => {
    expect(sql).toContain(
      "alter table public.video_checks enable row level security",
    );
    expect(sql).toContain(
      'create policy "Users can read their own video checks"',
    );
    expect(sql).toContain("(select auth.uid()) = auth_user_id");
    expect(sql).toContain(
      "grant select on table public.video_checks to authenticated",
    );
  });

  it("does not grant authenticated write access", () => {
    expect(sql).toContain(
      "revoke all on table public.video_checks from authenticated",
    );
    expect(sql).not.toContain("grant insert");
    expect(sql).not.toContain("grant update");
    expect(sql).not.toContain("grant delete");
  });

  it("requires complete encryption metadata and completion fields", () => {
    expect(sql).toContain("video_checks_encrypted_notes_check");
    expect(sql).toContain("video_checks_completed_fields_check");
    expect(sql).toContain("safety_acknowledged_at is not null");
  });
});
