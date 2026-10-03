import "server-only";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/user";
import { createAdminClient } from "@/lib/supabase/admin";

import type { StaffContext, StaffRole } from "./types";

import { STAFF_ROLES, isStaffRole } from "./roles";

export async function getStaffContext(): Promise<StaffContext | null> {
  const user = await requireUser();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("user_profiles")
    .select("id,role,account_status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error || !data || data.account_status !== "active") return null;
  if (!isStaffRole(data.role)) return null;

  return {
    authUserId: user.id,
    profileId: data.id,
    email: user.email ?? null,
    role: data.role,
  };
}

export async function requireStaff(
  allowedRoles: readonly StaffRole[] = STAFF_ROLES,
): Promise<StaffContext> {
  const context = await getStaffContext();

  if (!context || !allowedRoles.includes(context.role)) {
    redirect(
      "/dashboard?error=Administration%20access%20is%20not%20available%20for%20this%20account.",
    );
  }

  return context;
}
