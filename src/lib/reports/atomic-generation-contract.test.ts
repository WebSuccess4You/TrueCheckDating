import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/202606180015_build15_atomic_report_generation.sql",
  ),
  "utf8",
);
const action = readFileSync(
  join(process.cwd(), "src/app/report-actions.ts"),
  "utf8",
);

describe("atomic final report generation", () => {
  it("serializes allowance and version before writing a report and usage event", () => {
    const caseLock = migration.indexOf("from public.cases");
    const entitlementLock = migration.indexOf("from public.entitlements");
    const version = migration.indexOf("max(r.report_version_number)");
    const report = migration.indexOf("insert into public.reports");
    const usage = migration.indexOf("set usage_count = usage_count + 1");
    const event = migration.indexOf("insert into public.usage_events");
    expect(caseLock).toBeGreaterThan(-1);
    expect(entitlementLock).toBeGreaterThan(caseLock);
    expect(version).toBeGreaterThan(entitlementLock);
    expect(report).toBeGreaterThan(version);
    expect(usage).toBeGreaterThan(report);
    expect(event).toBeGreaterThan(usage);
    expect(migration.match(/for update/g)?.length).toBeGreaterThanOrEqual(3);
    expect(migration).toContain(
      "v_entitlement.usage_count >= v_entitlement.usage_limit",
    );
  });

  it("checks ownership and limits execution to the service role", () => {
    expect(migration).toContain("v_case.owner_profile_id");
    expect(migration).toContain("auth_user_id = p_user_id");
    expect(migration).toContain("user_id = p_user_id");
    expect(migration).toContain("security definer");
    expect(migration).toContain("set search_path = ''");
    expect(migration).toMatch(/from public, anon, authenticated;/);
    expect(migration).toMatch(/to service_role;/);
  });

  it("uses one database call for the report, allowance and usage record", () => {
    expect(action).toContain('"create_report_with_allowance"');
    expect(action).not.toContain('.from("reports").insert(');
    expect(action).not.toContain('.from("entitlements").update(');
    expect(action).not.toContain('.from("usage_events").insert(');
  });
});
