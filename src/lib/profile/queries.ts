import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { ProfileCheckRecord } from "./types";

const profileCheckColumns = [
  "id",
  "case_id",
  "auth_user_id",
  "status",
  "answers",
  "contradictions",
  "protective_signals",
  "component_score",
  "evidence_completeness",
  "summary",
  "version",
  "completed_at",
  "created_at",
  "updated_at",
].join(",");

export async function getOwnedProfileCheck(
  authUserId: string,
  caseId: string,
): Promise<ProfileCheckRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile_checks")
    .select(profileCheckColumns)
    .eq("case_id", caseId)
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw new Error("The profile consistency check could not be loaded.");
  }

  return data as unknown as ProfileCheckRecord | null;
}
