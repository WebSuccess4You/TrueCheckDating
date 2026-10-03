"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getLatestCompletedOwnedChatAnalysis } from "@/lib/ai/queries";
import { requireUser } from "@/lib/auth/user";
import { getOwnedCase } from "@/lib/cases/queries";
import { getOwnedImageCheck } from "@/lib/image/queries";
import { getEntitlementSummary } from "@/lib/payments/queries";
import { getOwnedProfileCheck } from "@/lib/profile/queries";
import { buildFinalReportBody } from "@/lib/reports/build";
import {
  REPORT_CONTENT_VERSION,
  REPORT_SCHEMA_VERSION,
} from "@/lib/reports/constants";
import type { GenerateReportActionState } from "@/lib/reports/types";
import { buildCombinedScoringInput } from "@/lib/scoring/input";
import { getLatestOwnedCaseAssessment } from "@/lib/scoring/queries";
import {
  calculateCombinedAssessment,
  isAssessmentOutdated,
} from "@/lib/scoring/scoring";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOwnedVideoCheck } from "@/lib/video/queries";

function value(formData: FormData, key: string): string {
  const item = formData.get(key);
  return typeof item === "string" ? item : "";
}

export async function generateFinalReportAction(
  _previousState: GenerateReportActionState,
  formData: FormData,
): Promise<GenerateReportActionState> {
  const caseId = value(formData, "caseId");
  if (!caseId)
    return { status: "error", message: "The case identifier is missing." };

  const user = await requireUser();
  const caseRecord = await getOwnedCase(user.id, caseId);
  if (!caseRecord)
    return {
      status: "error",
      message: "The case was not found or does not belong to this account.",
    };
  if (caseRecord.status !== "active")
    return {
      status: "error",
      message: "Restore this archived case before generating a new report.",
    };

  const entitlement = await getEntitlementSummary(user.id, caseId);
  if (!entitlement.hasFullReportAccess) {
    return {
      status: "error",
      message:
        "A verified individual-report purchase or active membership is required.",
    };
  }
  if (
    entitlement.usageLimit !== null &&
    entitlement.usageCount >= entitlement.usageLimit
  ) {
    return {
      status: "error",
      message:
        "The current report-update allowance has been used. Review billing access before generating another version.",
    };
  }

  const [assessment, chatAnalysis, profileCheck, videoCheck, imageCheck] =
    await Promise.all([
      getLatestOwnedCaseAssessment(user.id, caseId),
      getLatestCompletedOwnedChatAnalysis(user.id, caseId),
      getOwnedProfileCheck(user.id, caseId),
      getOwnedVideoCheck(user.id, caseId),
      getOwnedImageCheck(user.id, caseId),
    ]);

  if (
    !assessment ||
    assessment.status !== "preliminary" ||
    assessment.overall_score === null ||
    !assessment.concern_level
  ) {
    return {
      status: "error",
      message:
        "Calculate a complete preliminary result before generating the full report.",
    };
  }

  const current = calculateCombinedAssessment(
    buildCombinedScoringInput({
      chatAnalysis,
      profileCheck,
      videoCheck,
      imageCheck,
    }),
  );
  if (
    isAssessmentOutdated(
      assessment.source_fingerprints,
      current.sourceFingerprints,
    )
  ) {
    return {
      status: "error",
      message:
        "The preliminary result is outdated. Recalculate it before creating a new final report.",
    };
  }

  const generatedAt = new Date().toISOString();
  const body = buildFinalReportBody({
    caseRecord,
    assessment,
    chatAnalysis,
    profileCheck,
    videoCheck,
    imageCheck,
    generatedAt,
  });
  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      status: "error",
      message:
        "Final-report storage is not configured. Add the server-only Supabase key described in README.md.",
    };
  }

  const { data: generated, error } = await admin.rpc(
    "create_report_with_allowance",
    {
      p_user_id: user.id,
      p_case_id: caseId,
      p_assessment_id: assessment.id,
      p_snapshot: {
        report_schema_version: REPORT_SCHEMA_VERSION,
        report_content_version: REPORT_CONTENT_VERSION,
        prompt_version: chatAnalysis?.prompt_version ?? null,
        model_identifier: chatAnalysis?.model_identifier ?? null,
        component_scores: assessment.component_scores,
        report_body: body,
        generated_at: generatedAt,
      },
    },
  );
  const result = (
    generated as { outcome: string; report_version: number | null }[] | null
  )?.[0];
  if (error || !result) {
    return {
      status: "error",
      message:
        "The final report could not be saved. Apply the Build 15 report-generation migration and try again.",
    };
  }
  if (result.outcome === "limited") {
    return {
      status: "error",
      message:
        "The current report-update allowance has been used. Review billing access before generating another version.",
    };
  }
  if (result.outcome !== "created" || !result.report_version) {
    return {
      status: "error",
      message:
        "The case or report access changed before generation completed. Refresh and try again.",
    };
  }

  revalidatePath(`/cases/${caseId}/results`);
  revalidatePath(`/cases/${caseId}/report`);
  redirect(
    `/cases/${caseId}/report?message=${encodeURIComponent(`Final report version ${result.report_version} generated.`)}`,
  );
}
