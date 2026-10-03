import type { ChatAnalysisRecord } from "@/lib/ai/types";
import type { CaseRecord } from "@/lib/cases/types";
import type { ImageCheckRecord } from "@/lib/image/types";
import type { ProfileCheckRecord } from "@/lib/profile/types";
import type { CaseAssessmentRecord } from "@/lib/scoring/types";
import type { VideoCheckRecord } from "@/lib/video/types";

import {
  DEFAULT_REPORT_RECOMMENDATIONS,
  REPORT_CONTENT_VERSION,
  REPORT_SCHEMA_VERSION,
} from "./constants";
import type {
  FinalReportBody,
  ReportFinding,
  ReportProtectiveSignal,
  ReportRecommendation,
  ReportSeverity,
} from "./types";

function severity(value: string): ReportSeverity {
  if (value === "critical") return "critical";
  if (value === "high") return "high";
  if (value === "low") return "low";
  return "moderate";
}

function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = key(item).trim().toLowerCase();
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

export function buildFinalReportBody({
  caseRecord,
  assessment,
  chatAnalysis,
  profileCheck,
  videoCheck,
  imageCheck,
  generatedAt,
}: {
  caseRecord: CaseRecord;
  assessment: CaseAssessmentRecord;
  chatAnalysis: ChatAnalysisRecord | null;
  profileCheck: ProfileCheckRecord | null;
  videoCheck: VideoCheckRecord | null;
  imageCheck: ImageCheckRecord | null;
  generatedAt: string;
}): FinalReportBody {
  if (
    assessment.status !== "preliminary" ||
    assessment.overall_score === null ||
    !assessment.concern_level
  ) {
    throw new Error(
      "A completed combined assessment is required before a final report can be built.",
    );
  }

  const warningSigns: ReportFinding[] = [];
  for (const finding of chatAnalysis?.red_flags ?? []) {
    warningSigns.push({
      source: "Chat Analyzer",
      category: finding.category.replaceAll("_", " "),
      severity: severity(finding.severity),
      evidence: finding.evidence_excerpt,
      observation: finding.observation,
      interpretation: finding.why_it_matters,
    });
  }
  for (const finding of profileCheck?.contradictions ?? []) {
    const isFinancial = finding.key === "financialRequests";
    const isVerification = finding.key === "verificationCooperation";
    warningSigns.push({
      source: "Profile Consistency Check",
      category: finding.label,
      severity: finding.severity,
      evidence: `Recorded answer: ${finding.answer.replaceAll("_", " ")}`,
      observation: isFinancial
        ? "A financial request was recorded."
        : isVerification
          ? "The recorded verification cooperation raises concern."
          : `${finding.label} was recorded as inconsistent.`,
      interpretation: isFinancial
        ? "Pause financial commitments until the request and important claims are independently checked."
        : isVerification
          ? "A delayed or unclear response to a reasonable request leaves identity unverified."
          : "An unexplained inconsistency increases uncertainty and should be independently checked.",
    });
  }
  for (const observation of videoCheck?.avoidance_patterns ?? []) {
    warningSigns.push({
      source: "Video Call Verifier",
      category: "verification behavior",
      severity: "high",
      evidence: observation,
      observation,
      interpretation:
        "An uncompleted or unclear live interaction can leave identity unverified; one delay alone does not establish a pattern.",
    });
  }
  if (
    imageCheck?.status === "completed" &&
    imageCheck.result_category !== "unclear" &&
    (imageCheck.component_score ?? 0) >= 50
  ) {
    warningSigns.push({
      source: "Guided Reverse Image Checker",
      category: "user-recorded image-search finding",
      severity: (imageCheck.component_score ?? 0) >= 85 ? "high" : "moderate",
      evidence:
        imageCheck.summary ??
        "The user recorded an unclear or concerning reverse-image result.",
      observation:
        imageCheck.summary ??
        "The image-search result requires further verification.",
      interpretation:
        "TrueCheckDating.com did not independently verify the external search result, so it should be treated as a lead rather than proof.",
    });
  }

  const protectiveSignals: ReportProtectiveSignal[] = [];
  for (const signal of chatAnalysis?.protective_signals ?? []) {
    protectiveSignals.push({
      source: "Chat Analyzer",
      evidence: signal.evidence_excerpt,
      observation: signal.observation,
    });
  }
  for (const signal of profileCheck?.protective_signals ?? []) {
    protectiveSignals.push({
      source: "Profile Consistency Check",
      evidence: `Recorded answer: ${signal.answer.replaceAll("_", " ")}`,
      observation: `${signal.label} was recorded as reasonably consistent.`,
    });
  }
  for (const signal of videoCheck?.protective_signals ?? []) {
    protectiveSignals.push({
      source: "Video Call Verifier",
      evidence: signal,
      observation: signal,
    });
  }
  if (
    imageCheck?.status === "completed" &&
    (imageCheck.component_score ?? 100) <= 20
  ) {
    protectiveSignals.push({
      source: "Guided Reverse Image Checker",
      evidence:
        imageCheck.summary ?? "No strongly concerning match was recorded.",
      observation:
        "The user-recorded image-search result did not show a strong conflict, but it does not confirm identity.",
    });
  }

  const aiRecommendations: ReportRecommendation[] = (
    chatAnalysis?.recommended_actions ?? []
  ).map((item) => ({
    priority: item.priority,
    action: item.action,
    reason: item.reason,
  }));
  const recommendations = uniqueBy(
    [...aiRecommendations, ...DEFAULT_REPORT_RECOMMENDATIONS],
    (item) => item.action,
  ).slice(0, 10);

  const limitations = uniqueBy(
    [
      ...assessment.limitations,
      ...(chatAnalysis?.limitations ?? []),
      "This report uses user-supplied information and automated analysis; it does not establish legal identity, intent, criminality, genuineness, or safety.",
      "Private notes and the full raw conversation are intentionally excluded from this export.",
    ],
    (item) => item,
  );

  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    contentVersion: REPORT_CONTENT_VERSION,
    caseLabel: caseRecord.private_nickname,
    generatedAt,
    summary: `This report found ${assessment.concern_level.toLowerCase()} concern (${assessment.overall_score}/100) with ${assessment.confidence_level.toLowerCase()} confidence and ${assessment.evidence_completeness}% evidence coverage. The score is a structured concern indicator, not proof. Review the quoted findings and their limitations below, and verify important claims independently.`,
    evidenceReviewed: [
      {
        source: "Chat Analyzer",
        status:
          chatAnalysis?.status === "completed" ? "Reviewed" : "Not available",
        reviewedAt: chatAnalysis?.completed_at ?? null,
        version: chatAnalysis?.prompt_version ?? null,
        description:
          chatAnalysis?.status === "completed"
            ? "Structured conversation warning-pattern analysis."
            : "No completed chat analysis was available.",
      },
      {
        source: "Profile Consistency Check",
        status:
          profileCheck?.status === "completed" ? "Reviewed" : "Not available",
        reviewedAt: profileCheck?.completed_at ?? null,
        version: profileCheck?.version ?? null,
        description:
          profileCheck?.status === "completed"
            ? "Structured review of identity, timeline, profile, and financial claims."
            : "No completed profile check was available.",
      },
      {
        source: "Video Call Verifier",
        status:
          videoCheck?.status === "completed" ? "Reviewed" : "Not available",
        reviewedAt: videoCheck?.completed_at ?? null,
        version: videoCheck?.version ?? null,
        description:
          videoCheck?.status === "completed"
            ? "User-recorded live-call and verification behavior."
            : "No completed video-call check was available.",
      },
      {
        source: "Guided Reverse Image Checker",
        status:
          imageCheck?.status === "completed" &&
          imageCheck.result_category !== "unclear"
            ? "Reviewed"
            : "Not available",
        reviewedAt: imageCheck?.completed_at ?? null,
        version: imageCheck?.version ?? null,
        description:
          imageCheck?.status === "completed" &&
          imageCheck.result_category !== "unclear"
            ? "User-recorded external reverse-image search finding; not independently verified."
            : "No completed image check was available.",
      },
    ],
    warningSigns: uniqueBy(
      warningSigns,
      (item) => `${item.source}:${item.evidence}:${item.observation}`,
    ).slice(0, 20),
    protectiveSignals: uniqueBy(
      protectiveSignals,
      (item) => `${item.source}:${item.evidence}:${item.observation}`,
    ).slice(0, 16),
    componentBreakdown: assessment.component_scores,
    recommendations,
    limitations,
    disclaimer:
      "TrueCheckDating.com provides educational risk indicators and verification guidance. This report is not a background check, legal finding, identity confirmation, or guarantee of safety.",
  };
}
