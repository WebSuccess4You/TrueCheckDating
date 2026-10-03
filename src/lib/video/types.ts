import type { VideoQuestionKey } from "./constants";

export type VideoAnswerValue = string;
export type VideoAnswers = Partial<
  Record<VideoQuestionKey, VideoAnswerValue>
> & {
  notes?: string;
};

export type VideoCheckStatus = "in_progress" | "completed";

export type VideoCheckRecord = {
  id: string;
  case_id: string;
  auth_user_id: string;
  status: VideoCheckStatus;
  answers: VideoAnswers;
  notes: string | null;
  avoidance_patterns: string[];
  protective_signals: string[];
  component_score: number | null;
  evidence_completeness: number;
  summary: string | null;
  version: string;
  safety_acknowledged_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type VideoCheckActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialVideoCheckActionState: VideoCheckActionState = {
  status: "idle",
};
