import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/202606180003_build05_chat_submissions.sql",
  ),
  "utf8",
);

describe("Build 05 migration contract", () => {
  it("stores ciphertext and does not define a plaintext conversation column", () => {
    expect(migration).toContain("content_ciphertext text not null");
    expect(migration).toContain("content_iv text not null");
    expect(migration).not.toMatch(/conversation_text\s+text/i);
    expect(migration).not.toMatch(/content_plaintext/i);
  });

  it("enables RLS and scopes every policy to the signed-in owner", () => {
    expect(migration).toContain(
      "alter table public.chat_submissions enable row level security",
    );
    expect(migration).toContain("auth.uid()");
    expect(migration).toContain(
      'policy "Users can create chat submissions in their own cases"',
    );
    expect(migration).toContain("cases.auth_user_id = (select auth.uid())");
  });

  it("does not grant users permission to update analysis status or ciphertext", () => {
    expect(migration).not.toContain(
      "grant select, insert, update, delete on table public.chat_submissions",
    );
    expect(migration).not.toMatch(/grant update/i);
    expect(migration).toContain("grant insert (");
  });

  it("cascades case deletion to encrypted submissions", () => {
    expect(migration).toContain(
      "case_id uuid not null references public.cases(id) on delete cascade",
    );
  });
});
