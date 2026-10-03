import { videoQuestions } from "./constants";
import type { VideoAnswers } from "./types";

export type VideoScoreResult = {
  componentScore: number | null;
  evidenceCompleteness: number;
  avoidancePatterns: string[];
  protectiveSignals: string[];
  summary: string;
  severeConcernCount: number;
};

export function videoConcernLabel(score: number | null): string {
  if (score === null) return "Not enough evidence";
  if (score <= 24) return "Low";
  if (score <= 49) return "Moderate";
  if (score <= 74) return "High";
  return "Critical";
}

export function scoreVideoCheck(answers: VideoAnswers): VideoScoreResult {
  let weightedPoints = 0;
  let availableWeight = 0;
  const avoidancePatterns: string[] = [];
  const protectiveSignals: string[] = [];
  let severeConcernCount = 0;

  for (const question of videoQuestions) {
    const answer = answers[question.key];
    const option = question.options.find((item) => item.value === answer);
    if (!option || option.score === null) continue;

    weightedPoints += option.score * question.weight;
    availableWeight += question.weight;

    if ("concern" in option && option.concern) {
      avoidancePatterns.push(option.concern);
    }
    if ("protective" in option && option.protective) {
      protectiveSignals.push(option.protective);
    }
    if ("severe" in option && option.severe) severeConcernCount += 1;
  }

  if (!availableWeight) {
    return {
      componentScore: null,
      evidenceCompleteness: 0,
      avoidancePatterns,
      protectiveSignals,
      summary:
        "The video-call check does not contain enough observed information to calculate a concern score.",
      severeConcernCount,
    };
  }

  let componentScore = Math.round(weightedPoints / availableWeight);
  if (severeConcernCount >= 2) componentScore = Math.max(componentScore, 75);
  else if (severeConcernCount === 1)
    componentScore = Math.max(componentScore, 60);
  componentScore = Math.min(100, Math.max(0, componentScore));

  const notePoints =
    answers.notes && answers.notes.trim().length >= 20 ? 10 : 0;
  const evidenceCompleteness = Math.min(
    100,
    Math.round((availableWeight / 100) * 90) + notePoints,
  );
  const concernLabel = videoConcernLabel(componentScore);
  const mainFinding = avoidancePatterns[0]
    ? avoidancePatterns[0]
    : protectiveSignals[0]
      ? protectiveSignals[0]
      : "The available observations were mixed or limited.";

  return {
    componentScore,
    evidenceCompleteness,
    avoidancePatterns: avoidancePatterns.slice(0, 8),
    protectiveSignals: protectiveSignals.slice(0, 8),
    summary: `${concernLabel} video-verification concern. ${mainFinding} This checklist records user observations and does not establish legal identity, intent, criminality, genuineness, or safety.`,
    severeConcernCount,
  };
}
