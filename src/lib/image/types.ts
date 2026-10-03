import type { ImageResultCategory } from "./constants";

export type ImageCheckStatus = "in_progress" | "completed";

export type ImageCheckRecord = {
  id: string;
  case_id: string;
  auth_user_id: string;
  status: ImageCheckStatus;
  result_category: ImageResultCategory | null;
  source_links: string[];
  notes: string | null;
  component_score: number | null;
  evidence_completeness: number;
  summary: string | null;
  version: string;
  safety_acknowledged_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ImageCheckActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialImageCheckActionState: ImageCheckActionState = {
  status: "idle",
};
