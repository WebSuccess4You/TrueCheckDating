import "server-only";

import { createClient } from "@/lib/supabase/server";

import type { ReportSnapshotRecord } from "./types";

const reportColumns = [
  "id",
  "case_id",
  "auth_user_id",
  "case_assessment_id",
  "report_version_number",
  "report_schema_version",
  "report_content_version",
  "scoring_version",
  "prompt_version",
  "model_identifier",
  "overall_score",
  "concern_level",
  "confidence_score",
  "confidence_level",
  "evidence_completeness",
  "evidence_completeness_level",
  "component_scores",
  "report_body",
  "source_fingerprints",
  "generated_at",
].join(",");

export async function getLatestOwnedReport(
  authUserId: string,
  caseId: string,
): Promise<ReportSnapshotRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select(reportColumns)
    .eq("case_id", caseId)
    .eq("auth_user_id", authUserId)
    .order("report_version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("The final report could not be loaded.");
  return data as unknown as ReportSnapshotRecord | null;
}
