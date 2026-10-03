import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { requireSupabaseAdminEnvironment } from "@/lib/server-env";

export function createAdminClient() {
  const { url, serviceRoleKey } = requireSupabaseAdminEnvironment();

  return createSupabaseClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
