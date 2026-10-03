"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getLatestCompletedOwnedChatAnalysis } from "@/lib/ai/queries";
import { requireUser } from "@/lib/auth/user";
import { getOwnedCase } from "@/lib/cases/queries";
import { getOwnedImageCheck } from "@/lib/image/queries";
import { getOwnedProfileCheck } from "@/lib/profile/queries";
import { COMBINED_SCORING_VERSION } from "@/lib/scoring/constants";
import { buildCombinedScoringInput } from "@/lib/scoring/input";
import { calculateCombinedAssessment } from "@/lib/scoring/scoring";
import type { GenerateAssessmentActionState } from "@/lib/scoring/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOwnedVideoCheck } from "@/lib/video/queries";

function value(formData: FormData, key: string): string {
  const item = formData.get(key);
  return typeof item === "string" ? item : "";
}

export async function generatePreliminaryAssessmentAction(
  _previousState: GenerateAssessmentActionState,
  formData: FormData,
): Promise<GenerateAssessmentActionState> {
  const caseId = value(formData, "caseId");
  if (!caseId) {
    return { status: "error", message: "The case identifier is missing." };
  }

  const user = await requireUser();
  const caseRecord = await getOwnedCase(user.id, caseId);
  if (!caseRecord) {
    return {
      status: "error",
      message: "The case was not found or does not belong to this account.",
    };
  }

  if (caseRecord.status !== "active") {
    return {
      status: "error",
      message: "Restore this archived case before calculating a result.",
    };
  }

  const [chatAnalysis, profileCheck, videoCheck, imageCheck] =
    await Promise.all([
      getLatestCompletedOwnedChatAnalysis(user.id, caseId),
      getOwnedProfileCheck(user.id, caseId),
      getOwnedVideoCheck(user.id, caseId),
      getOwnedImageCheck(user.id, caseId),
    ]);

  const scoringInput = buildCombinedScoringInput({
    chatAnalysis,
    profileCheck,
    videoCheck,
    imageCheck,
  });
  const assessment = calculateCombinedAssessment(scoringInput);

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      status: "error",
      message:
        "Preliminary-result storage is not configured. Add the server-only Supabase key described in README.md, then try again.",
    };
  }

  const now = new Date().toISOString();
  const { error: insertError } = await admin.from("case_assessments").insert({
    case_id: caseRecord.id,
    owner_profile_id: caseRecord.owner_profile_id,
    auth_user_id: user.id,
    status: assessment.status,
    overall_score: assessment.overallScore,
    concern_level: assessment.concernLevel,
    confidence_score: assessment.confidenceScore,
    confidence_level: assessment.confidenceLevel,
    evidence_completeness: assessment.evidenceCompleteness,
    evidence_completeness_level: assessment.evidenceCompletenessLevel,
    available_weight: assessment.availableWeight,
    component_scores: assessment.components,
    completed_sources: assessment.completedSources,
    missing_sources: assessment.missingSources,
    source_fingerprints: assessment.sourceFingerprints,
    scoring_version: COMBINED_SCORING_VERSION,
    limitations: assessment.limitations,
    created_at: now,
  });

  if (insertError) {
    return {
      status: "error",
      message:
        "The preliminary result could not be saved. Make sure the Build 10 migration has been applied, then try again.",
    };
  }

  const { error: caseUpdateError } = await admin
    .from("cases")
    .update({
      latest_concern_level: assessment.concernLevel,
      latest_risk_score: assessment.overallScore,
      completion_percent: assessment.ready
        ? 100
        : caseRecord.completion_percent,
      updated_at: now,
    })
    .eq("id", caseRecord.id)
    .eq("auth_user_id", user.id);

  if (caseUpdateError) {
    return {
      status: "error",
      message:
        "The result was calculated, but the case summary could not be updated. Refresh and try again.",
    };
  }

  revalidatePath(`/cases/${caseId}`);
  revalidatePath(`/cases/${caseId}/results`);
  revalidatePath("/dashboard");

  redirect(
    `/cases/${caseId}/results?message=${encodeURIComponent(
      assessment.ready
        ? "Preliminary combined result calculated."
        : "Progress reviewed. Complete the Chat Analyzer and at least one other check before a combined score can be shown.",
    )}`,
  );
}
