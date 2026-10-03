export const IMAGE_CHECK_VERSION = "2026-06-18.1";
export const IMAGE_NOTES_MAX_CHARACTERS = 2_000;
export const IMAGE_SOURCE_LINK_MAX_CHARACTERS = 2_048;
export const IMAGE_SOURCE_LINK_LIMIT = 3;

export const imageSearchServices = [
  {
    name: "Google Lens",
    href: "https://lens.google/",
    description:
      "Search a saved photo or screenshot for visually similar images and pages where the image may appear.",
  },
  {
    name: "Bing Visual Search",
    href: "https://www.bing.com/camera",
    description:
      "Upload an image to look for similar images, products, objects, and pages on the web.",
  },
  {
    name: "TinEye",
    href: "https://tineye.com/",
    description:
      "Look for exact or modified copies and inspect where an image has appeared online.",
  },
] as const;

export const imageResultOptions = [
  {
    value: "no_meaningful_match",
    label: "No meaningful match found",
    help: "The services searched did not show a useful exact or near-exact match. This does not confirm identity.",
    score: 20,
  },
  {
    value: "same_identity_match",
    label: "Same image appears under the same identity",
    help: "The image appeared on an established source that is consistent with the claimed identity.",
    score: 10,
  },
  {
    value: "different_identity_match",
    label: "Same image appears under another identity",
    help: "An exact or near-exact image appeared with a different name or personal story.",
    score: 90,
  },
  {
    value: "many_unrelated_profiles",
    label: "Image appears on many unrelated profiles",
    help: "The same image appeared across multiple unrelated names, locations, or profiles.",
    score: 85,
  },
  {
    value: "stock_or_public_image",
    label: "Stock, commercial, or public-figure image",
    help: "The image appears to belong to a stock library, advertisement, public figure, or unrelated public source.",
    score: 95,
  },
  {
    value: "unclear",
    label: "Result unclear",
    help: "The results were ambiguous, low quality, or not sufficient to support a conclusion.",
    score: 50,
  },
] as const;

export type ImageResultCategory = (typeof imageResultOptions)[number]["value"];
