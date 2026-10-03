import type { ChatAnalysisRecord } from "@/lib/ai/types";
import type { ImageCheckRecord } from "@/lib/image/types";
import type { ProfileCheckRecord } from "@/lib/profile/types";
import type { VideoCheckRecord } from "@/lib/video/types";

import type { CombinedScoringInput } from "./types";

export function buildCombinedScoringInput({
  chatAnalysis,
  profileCheck,
  videoCheck,
  imageCheck,
}: {
  chatAnalysis: ChatAnalysisRecord | null;
  profileCheck: ProfileCheckRecord | null;
  videoCheck: VideoCheckRecord | null;
  imageCheck: ImageCheckRecord | null;
}): CombinedScoringInput {
  const chatCompleted = chatAnalysis?.status === "completed";
  const imageCompleted = Boolean(
    imageCheck?.status === "completed" &&
    imageCheck.result_category !== "unclear",
  );
  const categories = chatAnalysis?.category_scores;

  return {
    chat: {
      completed: chatCompleted,
      communicationManipulationScore:
        chatCompleted && categories
          ? categories.communication_manipulation
          : null,
      financialPressureScore:
        chatCompleted && categories ? categories.financial_pressure : null,
      urgencyIsolationScore:
        chatCompleted && categories ? categories.urgency_and_isolation : null,
      confidenceScore: chatCompleted ? chatAnalysis.confidence_score : null,
      evidenceCompleteness:
        chatCompleted && chatAnalysis.evidence_completeness !== null
          ? chatAnalysis.evidence_completeness
          : 0,
      sourceId: chatCompleted ? chatAnalysis.id : null,
      promptVersion: chatCompleted ? chatAnalysis.prompt_version : null,
      modelIdentifier: chatCompleted ? chatAnalysis.model_identifier : null,
      sourceCompletedAt: chatCompleted ? chatAnalysis.completed_at : null,
    },
    profile: {
      completed: profileCheck?.status === "completed",
      score:
        profileCheck?.status === "completed"
          ? profileCheck.component_score
          : null,
      evidenceCompleteness:
        profileCheck?.status === "completed"
          ? profileCheck.evidence_completeness
          : 0,
      sourceId: profileCheck?.id ?? null,
      sourceVersion: profileCheck?.version ?? null,
      sourceUpdatedAt: profileCheck?.updated_at ?? null,
    },
    video: {
      completed: videoCheck?.status === "completed",
      score:
        videoCheck?.status === "completed" ? videoCheck.component_score : null,
      evidenceCompleteness:
        videoCheck?.status === "completed"
          ? videoCheck.evidence_completeness
          : 0,
      sourceId: videoCheck?.id ?? null,
      sourceVersion: videoCheck?.version ?? null,
      sourceUpdatedAt: videoCheck?.updated_at ?? null,
    },
    image: {
      completed: imageCompleted,
      score: imageCompleted ? (imageCheck?.component_score ?? null) : null,
      evidenceCompleteness: imageCompleted
        ? (imageCheck?.evidence_completeness ?? 0)
        : 0,
      sourceId: imageCheck?.id ?? null,
      sourceVersion: imageCheck?.version ?? null,
      sourceUpdatedAt: imageCheck?.updated_at ?? null,
    },
  };
}
