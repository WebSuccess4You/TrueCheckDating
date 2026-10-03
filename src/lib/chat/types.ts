export type ChatSubmissionStatus =
  | "stored"
  | "pending_ai_connection"
  | "analysis_processing"
  | "analysis_completed"
  | "analysis_failed";

export type ChatSubmissionRecord = {
  id: string;
  case_id: string;
  owner_profile_id: string;
  auth_user_id: string;
  source_type: "pasted_text";
  content_ciphertext: string;
  content_iv: string;
  content_character_count: number;
  content_hash: string;
  encryption_version: string;
  consent_version: string;
  consent_acknowledged_at: string;
  status: ChatSubmissionStatus;
  created_at: string;
};

export type ChatSubmissionSummary = Pick<
  ChatSubmissionRecord,
  "id" | "case_id" | "content_character_count" | "status" | "created_at"
>;

export type ChatSubmissionActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialChatSubmissionActionState: ChatSubmissionActionState = {
  status: "idle",
};
