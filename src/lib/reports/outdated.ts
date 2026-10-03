import { isAssessmentOutdated } from "@/lib/scoring/scoring";
import type { SourceFingerprint } from "@/lib/scoring/types";

export function isReportOutdated(
  stored: Record<string, SourceFingerprint>,
  current: Record<string, SourceFingerprint>,
): boolean {
  return isAssessmentOutdated(stored, current);
}
