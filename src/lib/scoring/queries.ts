import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { CaseAssessmentRecord } from "./types";

const assessmentColumns = [
  "id",
  "case_id",
  "auth_user_id",
  "status",
  "overall_score",
  "concern_level",
  "confidence_score",
  "confidence_level",
  "evidence_completeness",
  "evidence_completeness_level",
  "available_weight",
  "component_scores",
  "completed_sources",
  "missing_sources",
  "source_fingerprints",
  "scoring_version",
  "limitations",
  "created_at",
].join(",");

export async function getLatestOwnedCaseAssessment(
  authUserId: string,
  caseId: string,
): Promise<CaseAssessmentRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("case_assessments")
    .select(assessmentColumns)
    .eq("case_id", caseId)
    .eq("auth_user_id", authUserId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error("The preliminary result could not be loaded.");
  }

  return data as unknown as CaseAssessmentRecord | null;
}
