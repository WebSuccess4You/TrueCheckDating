import "server-only";

import { createClient } from "@/lib/supabase/server";

import { calculateCheckCompletion } from "./progress";

import type { CaseRecord } from "./types";

const caseColumns = [
  "id",
  "owner_profile_id",
  "auth_user_id",
  "private_nickname",
  "communication_platform",
  "claimed_name_or_alias",
  "claimed_location",
  "communication_started_on",
  "status",
  "completion_percent",
  "latest_concern_level",
  "latest_risk_score",
  "lawful_use_acknowledged_at",
  "archived_at",
  "created_at",
  "updated_at",
].join(",");

export async function listOwnedCases(
  authUserId: string,
): Promise<CaseRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cases")
    .select(caseColumns)
    .eq("auth_user_id", authUserId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error("The saved cases could not be loaded.");
  }

  const cases = (data ?? []) as unknown as CaseRecord[];
  if (!cases.length) return cases;
  const caseIds = cases.map((item) => item.id);
  const results = await Promise.all([
    supabase
      .from("chat_submissions")
      .select("case_id,status,created_at")
      .eq("auth_user_id", authUserId)
      .in("case_id", caseIds)
      .order("created_at", { ascending: false }),
    supabase
      .from("profile_checks")
      .select("case_id,status")
      .eq("auth_user_id", authUserId)
      .in("case_id", caseIds),
    supabase
      .from("image_checks")
      .select("case_id,status,result_category")
      .eq("auth_user_id", authUserId)
      .in("case_id", caseIds),
    supabase
      .from("video_checks")
      .select("case_id,status")
      .eq("auth_user_id", authUserId)
      .in("case_id", caseIds),
  ]);
  if (results.some((result) => result.error)) {
    throw new Error("The saved case progress could not be loaded.");
  }
  const [chat, profile, image, video] = results;
  return cases.map((item) => ({
    ...item,
    completion_percent: calculateCheckCompletion(
      chat.data?.find((check) => check.case_id === item.id),
      profile.data?.find((check) => check.case_id === item.id),
      image.data?.find((check) => check.case_id === item.id),
      video.data?.find((check) => check.case_id === item.id),
    ),
  }));
}

export async function getOwnedCase(
  authUserId: string,
  caseId: string,
): Promise<CaseRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cases")
    .select(caseColumns)
    .eq("id", caseId)
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw new Error("The case could not be loaded.");
  }

  return data as unknown as CaseRecord | null;
}
