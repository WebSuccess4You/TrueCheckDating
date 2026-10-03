export const COMBINED_SCORING_VERSION = "2026-06-18.1";

export const componentWeights = {
  communication_manipulation: 25,
  financial_pressure_urgency: 25,
  profile_consistency: 20,
  video_verification: 15,
  reverse_image: 15,
} as const;

export const evidenceWeights = {
  chat: 35,
  profile: 25,
  video: 20,
  image: 20,
} as const;

export type CombinedComponentKey = keyof typeof componentWeights;
