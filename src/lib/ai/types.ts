import type { ChatAnalysisOutput } from "./schema";

export type ChatAnalysisStatus =
  "queued" | "processing" | "completed" | "failed" | "rejected";

export type ChatAnalysisRecord = {
  id: string;
  case_id: string;
  chat_submission_id: string;
  auth_user_id: string;
  status: ChatAnalysisStatus;
  risk_score: number | null;
  concern_level: ChatAnalysisOutput["concern_level"] | null;
  confidence_score: number | null;
  confidence_level: ChatAnalysisOutput["confidence_level"] | null;
  evidence_completeness: number | null;
  summary: string | null;
  category_scores: ChatAnalysisOutput["category_scores"] | null;
  red_flags: ChatAnalysisOutput["red_flags"] | null;
  protective_signals: ChatAnalysisOutput["protective_signals"] | null;
  recommended_actions: ChatAnalysisOutput["recommended_actions"] | null;
  limitations: string[] | null;
  prompt_version: string;
  model_identifier: string;
  schema_version: string;
  input_token_count: number | null;
  output_token_count: number | null;
  provider_response_id: string | null;
  request_id: string;
  error_code: string | null;
  created_at: string;
  completed_at: string | null;
};

export type ChatAnalysisActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const initialChatAnalysisActionState: ChatAnalysisActionState = {
  status: "idle",
};
