import "server-only";

import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(
      "/login?message=Please%20log%20in%20to%20open%20your%20private%20account.",
    );
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("account_status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profile && profile.account_status !== "active") {
    await supabase.auth.signOut();
    redirect(
      "/login?message=This%20account%20is%20unavailable.%20Contact%20support%20if%20this%20is%20unexpected.",
    );
  }

  return user;
}
