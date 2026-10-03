import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/202606180014_build15_atomic_admin_audit.sql",
  ),
  "utf8",
);
const actions = readFileSync(
  join(process.cwd(), "src/app/admin-actions.ts"),
  "utf8",
);

describe("admin mutation audit boundary", () => {
  it("places status changes and their audit inserts in each database function", () => {
    const account = migration.slice(
      migration.indexOf("function public.change_account_status_audited"),
      migration.indexOf("function public.resolve_system_error_audited"),
    );
    const error = migration.slice(
      migration.indexOf("function public.resolve_system_error_audited"),
      migration.indexOf("revoke all on function"),
    );
    expect(account).toContain("for update;");
    expect(account.indexOf("update public.user_profiles")).toBeLessThan(
      account.indexOf("insert into public.audit_events"),
    );
    expect(error.indexOf("update public.system_errors")).toBeLessThan(
      error.indexOf("insert into public.audit_events"),
    );
    expect(account).toContain("role = 'admin'");
    expect(account).toContain("role = 'user'");
    expect(error).toContain("role = 'admin'");
  });

  it("allows only trusted server code to call the mutation functions", () => {
    expect(migration).toMatch(/from public, anon, authenticated;/g);
    expect(migration.match(/to service_role;/g)).toHaveLength(2);
    expect(actions).toContain('"change_account_status_audited"');
    expect(actions).toContain('"resolve_system_error_audited"');
    expect(actions).not.toContain("recordAuditEvent(");
  });
});
