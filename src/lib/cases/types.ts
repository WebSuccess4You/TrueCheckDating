export type CaseStatus = "active" | "archived";

export type CaseRecord = {
  id: string;
  owner_profile_id: string;
  auth_user_id: string;
  private_nickname: string;
  communication_platform: string | null;
  claimed_name_or_alias: string | null;
  claimed_location: string | null;
  communication_started_on: string | null;
  status: CaseStatus;
  completion_percent: number;
  latest_concern_level: string | null;
  latest_risk_score: number | null;
  lawful_use_acknowledged_at: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CaseActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

export const initialCaseActionState: CaseActionState = { status: "idle" };
