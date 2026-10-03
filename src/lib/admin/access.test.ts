import { describe, expect, it } from "vitest";

import {
  canManageUserAccounts,
  hasAllowedStaffRole,
  isStaffRole,
} from "./roles";

describe("Build 14 staff authorization", () => {
  it("recognizes only support and admin as staff roles", () => {
    expect(isStaffRole("support")).toBe(true);
    expect(isStaffRole("admin")).toBe(true);
    expect(isStaffRole("user")).toBe(false);
    expect(isStaffRole(undefined)).toBe(false);
  });

  it("rejects normal users from staff-only areas", () => {
    expect(hasAllowedStaffRole("user", ["support", "admin"])).toBe(false);
    expect(hasAllowedStaffRole("support", ["support", "admin"])).toBe(true);
  });

  it("allows only administrators to manage user status", () => {
    expect(canManageUserAccounts("admin")).toBe(true);
    expect(canManageUserAccounts("support")).toBe(false);
    expect(canManageUserAccounts("user")).toBe(false);
  });
});
