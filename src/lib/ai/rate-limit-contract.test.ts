import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/202606180013_build15_chat_rate_limit.sql",
  ),
  "utf8",
);
const action = readFileSync(
  join(process.cwd(), "src/app/analysis-actions.ts"),
  "utf8",
);

describe("chat analysis rate-limit boundary", () => {
  it("serializes an account's count and insert in one database transaction", () => {
    const lock = migration.indexOf("pg_advisory_xact_lock");
    const count = migration.indexOf("select count(*) into v_count");
    const insert = migration.indexOf("insert into public.chat_analyses");
    expect(lock).toBeGreaterThan(-1);
    expect(count).toBeGreaterThan(lock);
    expect(insert).toBeGreaterThan(count);
    expect(migration).toContain(
      "a.created_at >= pg_catalog.now() - interval '1 hour'",
    );
    expect(migration).toContain("if v_count >= p_hourly_limit then");
  });

  it("restricts the reservation function to the server service role", () => {
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toMatch(/from public, anon, authenticated;/);
    expect(migration).toMatch(/to service_role;/);
    expect(migration).toContain("c.auth_user_id = p_user_id");
    expect(migration).toContain("s.auth_user_id = p_user_id");
  });

  it("starts analysis through the atomic function before calling OpenAI", () => {
    expect(action).toContain('"start_chat_analysis_with_limit"');
    expect(action).not.toContain(
      '.select("id", { count: "exact", head: true })',
    );
    expect(action.indexOf('"start_chat_analysis_with_limit"')).toBeLessThan(
      action.indexOf("runOpenAIChatAnalysis({"),
    );
  });
});
