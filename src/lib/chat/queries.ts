import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { ChatSubmissionRecord, ChatSubmissionSummary } from "./types";

const summaryColumns = [
  "id",
  "case_id",
  "content_character_count",
  "status",
  "created_at",
].join(",");

const fullColumns = [
  "id",
  "case_id",
  "owner_profile_id",
  "auth_user_id",
  "source_type",
  "content_ciphertext",
  "content_iv",
  "content_character_count",
  "content_hash",
  "encryption_version",
  "consent_version",
  "consent_acknowledged_at",
  "status",
  "created_at",
].join(",");

export async function listOwnedChatSubmissions(
  authUserId: string,
  caseId: string,
): Promise<ChatSubmissionSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_submissions")
    .select(summaryColumns)
    .eq("case_id", caseId)
    .eq("auth_user_id", authUserId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("The saved conversation submissions could not be loaded.");
  }

  return (data ?? []) as unknown as ChatSubmissionSummary[];
}

export async function getOwnedChatSubmission(
  authUserId: string,
  caseId: string,
  submissionId: string,
): Promise<ChatSubmissionRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_submissions")
    .select(fullColumns)
    .eq("id", submissionId)
    .eq("case_id", caseId)
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw new Error("The conversation submission could not be loaded.");
  }

  return data as unknown as ChatSubmissionRecord | null;
}

export async function getLatestOwnedChatSubmission(
  authUserId: string,
  caseId: string,
): Promise<ChatSubmissionSummary | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_submissions")
    .select(summaryColumns)
    .eq("case_id", caseId)
    .eq("auth_user_id", authUserId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("The latest conversation submission could not be loaded.");
  }

  return data as unknown as ChatSubmissionSummary | null;
}
