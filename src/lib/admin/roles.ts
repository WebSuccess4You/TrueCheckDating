import type { StaffRole, UserRole } from "./types";

export const STAFF_ROLES = ["support", "admin"] as const;

export function isStaffRole(
  role: string | null | undefined,
): role is StaffRole {
  return role === "support" || role === "admin";
}

export function hasAllowedStaffRole(
  role: UserRole,
  allowedRoles: readonly StaffRole[],
): boolean {
  return isStaffRole(role) && allowedRoles.includes(role);
}

export function canManageUserAccounts(role: UserRole): boolean {
  return role === "admin";
}
