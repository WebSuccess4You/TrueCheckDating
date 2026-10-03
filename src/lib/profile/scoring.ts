import { profileQuestions, type ProfileQuestionKey } from "./constants";
import type {
  ProfileAnswers,
  ProfileFinding,
  ProfileProtectiveSignal,
} from "./types";

export type ProfileScoreResult = {
  componentScore: number | null;
  evidenceCompleteness: number;
  contradictions: ProfileFinding[];
  protectiveSignals: ProfileProtectiveSignal[];
  summary: string;
};

function answerLabel(key: ProfileQuestionKey, value: string): string | null {
  const question = profileQuestions.find((item) => item.key === key);
  const option = question?.options.find((item) => item.value === value);
  return option?.label ?? null;
}

export function profileConcernLabel(score: number | null): string {
  if (score === null) return "Not enough evidence";
  if (score <= 24) return "Low";
  if (score <= 49) return "Moderate";
  if (score <= 74) return "High";
  return "Critical";
}

export function scoreProfileCheck(answers: ProfileAnswers): ProfileScoreResult {
  let availableWeight = 0;
  let weightedPoints = 0;
  const contradictions: ProfileFinding[] = [];
  const protectiveSignals: ProfileProtectiveSignal[] = [];

  for (const question of profileQuestions) {
    const answer = answers[question.key];
    if (!answer) continue;

    const option = question.options.find((item) => item.value === answer);
    if (!option || option.score === null) continue;

    availableWeight += question.weight;
    weightedPoints += option.score * question.weight;

    if (option.score >= 35) {
      contradictions.push({
        key: question.key,
        label: question.label,
        answer: option.label,
        severity: option.score >= 75 ? "high" : "moderate",
        score: option.score,
      });
    } else if (option.score <= 10) {
      protectiveSignals.push({
        key: question.key,
        label: question.label,
        answer: option.label,
      });
    }
  }

  const componentScore =
    availableWeight === 0 ? null : Math.round(weightedPoints / availableWeight);
  const evidenceCompleteness = Math.round(availableWeight);
  const concern = profileConcernLabel(componentScore);

  let summary: string;
  if (componentScore === null) {
    summary =
      "The profile check was completed, but there is not enough known information to calculate a profile-consistency concern score.";
  } else if (componentScore <= 24) {
    summary =
      "The supplied profile information is mostly consistent. Continue ordinary independent verification because consistency alone does not prove identity or safety.";
  } else if (componentScore <= 49) {
    summary =
      "The recorded answers show some concerns. Review the specific findings and verify important claims before major commitments.";
  } else if (componentScore <= 74) {
    summary =
      "The recorded answers show notable concerns. Pause financial or major commitments until the specific findings are independently checked.";
  } else {
    summary =
      "The recorded answers show serious concerns in the available areas. Use caution and do not treat identity or claims as confirmed.";
  }

  return {
    componentScore,
    evidenceCompleteness,
    contradictions,
    protectiveSignals,
    summary: `${concern} profile concern. ${summary}`,
  };
}

export function getAnswerLabel(key: ProfileQuestionKey, value: string): string {
  return answerLabel(key, value) ?? value;
}
