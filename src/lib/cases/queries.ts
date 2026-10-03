import "server-only";

import { createClient } from "@/lib/supabase/server";

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

  return (data ?? []) as unknown as CaseRecord[];
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
