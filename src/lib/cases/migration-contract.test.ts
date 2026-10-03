import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/202606180002_build04_cases.sql"),
  "utf8",
);

describe("Build 04 migration contract", () => {
  it("enables RLS and scopes policies to auth.uid", () => {
    expect(migration).toContain(
      "alter table public.cases enable row level security",
    );
    expect(migration).toContain("auth.uid()");
    expect(migration).toContain('policy "Users can read their own cases"');
    expect(migration).toContain('policy "Users can update their own cases"');
  });

  it("does not grant authenticated users unrestricted score updates", () => {
    expect(migration).not.toContain(
      "grant select, insert, update, delete on table public.cases",
    );
    expect(migration).toContain("grant update (");
    expect(migration).not.toMatch(/grant update \([\s\S]*?latest_risk_score/);
    expect(migration).not.toMatch(/grant update \([\s\S]*?completion_percent/);
  });

  it("defines owner-scoped transactional deletion", () => {
    expect(migration).toContain("function public.delete_owned_case");
    expect(migration).toContain("security invoker");
    expect(migration).toContain("and auth_user_id = (select auth.uid())");
  });
});
