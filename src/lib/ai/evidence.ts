import type { ChatAnalysisOutput } from "./schema";

function normalizeForComparison(value: string): string {
  return value
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();
}

export function excerptAppearsInTranscript(
  excerpt: string,
  transcript: string,
): boolean {
  const normalizedExcerpt = normalizeForComparison(excerpt);
  const normalizedTranscript = normalizeForComparison(transcript);

  if (!normalizedExcerpt) return false;
  if (normalizedTranscript.includes(normalizedExcerpt)) return true;

  // An AI may prepend a correct speaker label to words quoted from the middle
  // of that speaker's turn. Check the turn before accepting that attribution.
  const labeledExcerpt = /^([^:\n]{1,40}):\s+(.+)$/.exec(normalizedExcerpt);
  if (!labeledExcerpt) return false;
  const [, speaker, words] = labeledExcerpt;
  if (words.length < 8) return false;

  const markers = Array.from(
    normalizedTranscript.matchAll(
      /(?:^|\s)([\p{L}][\p{L}\p{N} _'-]{0,40}):\s/gu,
    ),
  );
  return markers.some((marker, index) => {
    if (marker[1].trim() !== speaker.trim()) return false;
    const start = (marker.index ?? 0) + marker[0].length;
    const end = markers[index + 1]?.index ?? normalizedTranscript.length;
    return normalizedTranscript.slice(start, end).includes(words);
  });
}

export function validateEvidenceExcerpts(
  result: ChatAnalysisOutput,
  transcript: string,
): { valid: true } | { valid: false; invalidExcerpt: string } {
  const excerpts = [
    ...result.red_flags.map((finding) => finding.evidence_excerpt),
    ...result.protective_signals.map((finding) => finding.evidence_excerpt),
  ];

  for (const excerpt of excerpts) {
    if (!excerptAppearsInTranscript(excerpt, transcript)) {
      return { valid: false, invalidExcerpt: excerpt };
    }
  }

  return { valid: true };
}

export function validateScoreEvidence(result: ChatAnalysisOutput): boolean {
  const supportedCategories = new Set(
    result.red_flags.map((finding) => finding.category),
  );

  for (const finding of result.red_flags) {
    supportedCategories.add(finding.category);
  }

  for (const finding of [
    "communication_manipulation",
    "financial_pressure",
    "identity_consistency",
    "verification_behavior",
    "urgency_and_isolation",
  ] as const) {
    if (
      result.category_scores[finding] > 0 &&
      !supportedCategories.has(finding)
    ) {
      return false;
    }
  }

  if (
    result.red_flags.length === 0 &&
    (result.risk_score !== 0 || result.concern_level !== "low")
  ) {
    return false;
  }

  return true;
}
