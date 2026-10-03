import { imageResultOptions, type ImageResultCategory } from "./constants";

export type ImageScoreResult = {
  componentScore: number | null;
  evidenceCompleteness: number;
  summary: string;
  classification: "protective" | "neutral" | "concern" | "unavailable";
};

export function imageConcernLabel(score: number | null): string {
  if (score === null) return "Not enough evidence";
  if (score <= 24) return "Low";
  if (score <= 49) return "Moderate";
  if (score <= 74) return "High";
  return "Critical";
}

export function getImageResultOption(category: ImageResultCategory) {
  return imageResultOptions.find((option) => option.value === category) ?? null;
}

export function scoreImageCheck(
  category: ImageResultCategory | null,
  sourceLinks: string[],
  notes: string | null,
): ImageScoreResult {
  if (!category) {
    return {
      componentScore: null,
      evidenceCompleteness: 0,
      summary:
        "The image check has not been completed, so no image-search concern score is available.",
      classification: "unavailable",
    };
  }

  if (category === "unclear") {
    return {
      componentScore: null,
      evidenceCompleteness: 0,
      summary:
        "The image-search result is inconclusive; it contributes no concern or reassurance to the combined score.",
      classification: "unavailable",
    };
  }

  const option = getImageResultOption(category);
  if (!option) {
    return {
      componentScore: null,
      evidenceCompleteness: 0,
      summary:
        "The selected image-search result could not be scored. Review the result and try again.",
      classification: "unavailable",
    };
  }

  const validLinkCount = Math.min(sourceLinks.length, 2);
  const notePoints = notes && notes.trim().length >= 20 ? 10 : 0;
  const evidenceCompleteness = Math.min(
    100,
    70 + validLinkCount * 10 + notePoints,
  );

  let classification: ImageScoreResult["classification"] = "neutral";
  if (category === "same_identity_match") classification = "protective";
  if (
    category === "different_identity_match" ||
    category === "many_unrelated_profiles" ||
    category === "stock_or_public_image"
  ) {
    classification = "concern";
  }

  const prefix = `${imageConcernLabel(option.score)} image-search concern.`;
  let detail: string;

  switch (category) {
    case "same_identity_match":
      detail =
        "The recorded match is consistent with the claimed identity, which is a reassuring signal, but a matching page alone does not prove who is communicating with you.";
      break;
    case "no_meaningful_match":
      detail =
        "No useful match was recorded. Absence of a match is neutral evidence and does not confirm that the image or identity is genuine.";
      break;
    case "different_identity_match":
      detail =
        "The same or a near-identical image was recorded under a different identity. Independently inspect the source before making financial or major commitments.";
      break;
    case "many_unrelated_profiles":
      detail =
        "The image was recorded across multiple unrelated profiles. Reuse across unrelated identities is a substantial warning sign that requires independent verification.";
      break;
    case "stock_or_public_image":
      detail =
        "The image was recorded as stock, commercial, or associated with a public figure or unrelated public source. Do not treat the submitted profile as identity-confirmed.";
      break;
  }

  return {
    componentScore: option.score,
    evidenceCompleteness,
    summary: `${prefix} ${detail}`,
    classification,
  };
}
