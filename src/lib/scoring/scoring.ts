import { componentWeights, evidenceWeights } from "./constants";
import type {
  CombinedConcernLevel,
  CombinedConfidenceLevel,
  CombinedScoreResult,
  CombinedScoringInput,
  ComponentAssessment,
} from "./types";

function clamp(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return Math.round(
    values.reduce((sum, value) => sum + value, 0) / values.length,
  );
}

export function concernLevel(score: number): CombinedConcernLevel {
  if (score <= 24) return "Low";
  if (score <= 49) return "Moderate";
  if (score <= 74) return "High";
  return "Critical";
}

export function confidenceLevel(score: number): CombinedConfidenceLevel {
  if (score <= 39) return "Low";
  if (score <= 69) return "Moderate";
  return "High";
}

export function calculateCombinedAssessment(
  input: CombinedScoringInput,
): CombinedScoreResult {
  const financialCombined = average(
    [
      input.chat.financialPressureScore,
      input.chat.urgencyIsolationScore,
    ].filter((value): value is number => value !== null),
  );

  const components: ComponentAssessment[] = [
    {
      key: "communication_manipulation",
      label: "Communication and manipulation patterns",
      score: input.chat.completed
        ? input.chat.communicationManipulationScore
        : null,
      weight: componentWeights.communication_manipulation,
      included:
        input.chat.completed &&
        input.chat.communicationManipulationScore !== null,
      source: "chat",
    },
    {
      key: "financial_pressure_urgency",
      label: "Financial pressure, urgency, and isolation",
      score: input.chat.completed ? financialCombined : null,
      weight: componentWeights.financial_pressure_urgency,
      included: input.chat.completed && financialCombined !== null,
      source: "chat",
    },
    {
      key: "profile_consistency",
      label: "Profile and identity consistency",
      score: input.profile.completed ? input.profile.score : null,
      weight: componentWeights.profile_consistency,
      included: input.profile.completed && input.profile.score !== null,
      source: "profile",
    },
    {
      key: "video_verification",
      label: "Video-call and verification behavior",
      score: input.video.completed ? input.video.score : null,
      weight: componentWeights.video_verification,
      included: input.video.completed && input.video.score !== null,
      source: "video",
    },
    {
      key: "reverse_image",
      label: "Guided reverse-image findings",
      score: input.image.completed ? input.image.score : null,
      weight: componentWeights.reverse_image,
      included: input.image.completed && input.image.score !== null,
      source: "image",
    },
  ];

  const chatReady = components
    .filter((component) => component.source === "chat")
    .every((component) => component.included);
  const profileReady = components.some(
    (component) => component.source === "profile" && component.included,
  );
  const videoReady = components.some(
    (component) => component.source === "video" && component.included,
  );
  const imageReady = components.some(
    (component) => component.source === "image" && component.included,
  );

  const completedSources = [
    chatReady ? "Chat Analyzer" : null,
    profileReady ? "Profile Consistency Check" : null,
    videoReady ? "Video Call Verifier" : null,
    imageReady ? "Guided Reverse Image Checker" : null,
  ].filter((value): value is string => value !== null);

  const missingSources = [
    chatReady ? null : "Chat Analyzer",
    profileReady ? null : "Profile Consistency Check",
    videoReady ? null : "Video Call Verifier",
    imageReady ? null : "Guided Reverse Image Checker",
  ].filter((value): value is string => value !== null);

  const evidenceCompleteness = clamp(
    (input.chat.completed ? input.chat.evidenceCompleteness : 0) *
      (evidenceWeights.chat / 100) +
      (input.profile.completed ? input.profile.evidenceCompleteness : 0) *
        (evidenceWeights.profile / 100) +
      (input.video.completed ? input.video.evidenceCompleteness : 0) *
        (evidenceWeights.video / 100) +
      (input.image.completed ? input.image.evidenceCompleteness : 0) *
        (evidenceWeights.image / 100),
  );

  const hasSecondaryComponent = profileReady || videoReady || imageReady;
  const ready = chatReady && hasSecondaryComponent;

  const includedComponents = components.filter(
    (component) => component.included && component.score !== null,
  );
  const availableWeight = includedComponents.reduce(
    (sum, component) => sum + component.weight,
    0,
  );
  const weightedPoints = includedComponents.reduce(
    (sum, component) => sum + (component.score ?? 0) * component.weight,
    0,
  );
  const overallScore =
    ready && availableWeight > 0
      ? clamp(weightedPoints / availableWeight)
      : null;

  const scoreValues = includedComponents.map(
    (component) => component.score ?? 0,
  );
  const scoreRange = scoreValues.length
    ? Math.max(...scoreValues) - Math.min(...scoreValues)
    : 100;
  const uniqueSourceCount = new Set(
    includedComponents.map((component) => component.source),
  ).size;

  const weakEvidencePenalty = Math.min(
    20,
    Math.round((100 - evidenceCompleteness) * 0.2),
  );
  const aiConfidence = input.chat.confidenceScore ?? 0;
  const aiUncertaintyPenalty = input.chat.completed
    ? Math.min(15, Math.round((100 - aiConfidence) * 0.15))
    : 15;
  const conflictPenalty = scoreRange >= 60 ? 10 : scoreRange >= 45 ? 5 : 0;
  const agreementBonus =
    uniqueSourceCount >= 2 && scoreRange <= 20
      ? 10
      : uniqueSourceCount >= 2 && scoreRange <= 35
        ? 5
        : 0;

  const confidenceScore = clamp(
    evidenceCompleteness -
      weakEvidencePenalty -
      aiUncertaintyPenalty -
      conflictPenalty +
      agreementBonus,
  );

  return {
    status: ready ? "preliminary" : "not_ready",
    ready,
    overallScore,
    concernLevel: overallScore === null ? null : concernLevel(overallScore),
    confidenceScore,
    confidenceLevel: confidenceLevel(confidenceScore),
    evidenceCompleteness,
    evidenceCompletenessLevel: confidenceLevel(evidenceCompleteness),
    availableWeight,
    components,
    completedSources,
    missingSources,
    sourceFingerprints: {
      chat: {
        id: input.chat.sourceId,
        version: input.chat.promptVersion,
        updatedAt: input.chat.sourceCompletedAt,
      },
      profile: {
        id: input.profile.sourceId,
        version: input.profile.sourceVersion,
        updatedAt: input.profile.sourceUpdatedAt,
      },
      video: {
        id: input.video.sourceId,
        version: input.video.sourceVersion,
        updatedAt: input.video.sourceUpdatedAt,
      },
      image: {
        id: input.image.sourceId,
        version: input.image.sourceVersion,
        updatedAt: input.image.sourceUpdatedAt,
      },
    },
    limitations: [
      "This concern indicator is not proof of identity, intent, criminality, genuineness, or safety.",
      "The result depends on the accuracy and completeness of user-supplied information.",
      "User-recorded reverse-image findings are not independently verified by TrueCheckDating.com.",
      "A low concern result does not guarantee that a person or relationship is safe.",
    ],
  };
}

export function isAssessmentOutdated(
  stored: CombinedScoreResult["sourceFingerprints"],
  current: CombinedScoreResult["sourceFingerprints"],
): boolean {
  return Object.keys(current).some((key) => {
    const currentSource = current[key];
    const storedSource = stored[key];
    return (
      currentSource?.id !== storedSource?.id ||
      currentSource?.version !== storedSource?.version ||
      currentSource?.updatedAt !== storedSource?.updatedAt
    );
  });
}
