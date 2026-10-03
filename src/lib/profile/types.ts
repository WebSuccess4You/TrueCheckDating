import type { ProfileQuestionKey } from "./constants";

export type ProfileCheckStatus = "in_progress" | "completed";

export type ProfileAnswers = Partial<Record<ProfileQuestionKey, string>> & {
  notes?: string;
};

export type ProfileFinding = {
  key: ProfileQuestionKey;
  label: string;
  answer: string;
  severity: "moderate" | "high";
  score: number;
};

export type ProfileProtectiveSignal = {
  key: ProfileQuestionKey;
  label: string;
  answer: string;
};

export type ProfileCheckRecord = {
  id: string;
  case_id: string;
  auth_user_id: string;
  status: ProfileCheckStatus;
  answers: ProfileAnswers;
  contradictions: ProfileFinding[];
  protective_signals: ProfileProtectiveSignal[];
  component_score: number | null;
  evidence_completeness: number;
  summary: string | null;
  version: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileCheckActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialProfileCheckActionState: ProfileCheckActionState = {
  status: "idle",
};
