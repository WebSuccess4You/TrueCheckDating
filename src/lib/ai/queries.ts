import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { ChatAnalysisRecord } from "./types";

const analysisColumns = [
  "id",
  "case_id",
  "chat_submission_id",
  "auth_user_id",
  "status",
  "risk_score",
  "concern_level",
  "confidence_score",
  "confidence_level",
  "evidence_completeness",
  "summary",
  "category_scores",
  "red_flags",
  "protective_signals",
  "recommended_actions",
  "limitations",
  "prompt_version",
  "model_identifier",
  "schema_version",
  "input_token_count",
  "output_token_count",
  "provider_response_id",
  "request_id",
  "error_code",
  "created_at",
  "completed_at",
].join(",");

export async function getLatestOwnedChatAnalysis(
  authUserId: string,
  caseId: string,
  submissionId: string,
): Promise<ChatAnalysisRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_analyses")
    .select(analysisColumns)
    .eq("case_id", caseId)
    .eq("chat_submission_id", submissionId)
    .eq("auth_user_id", authUserId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("The conversation analysis could not be loaded.");
  }

  return data as unknown as ChatAnalysisRecord | null;
}

export async function getLatestCompletedOwnedChatAnalysis(
  authUserId: string,
  caseId: string,
): Promise<ChatAnalysisRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chat_analyses")
    .select(analysisColumns)
    .eq("case_id", caseId)
    .eq("auth_user_id", authUserId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("The latest completed chat analysis could not be loaded.");
  }

  return data as unknown as ChatAnalysisRecord | null;
}
