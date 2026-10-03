export const PROFILE_CHECK_VERSION = "2026-06-18.1";
export const PROFILE_NOTES_MAX_CHARACTERS = 2_000;

export const profileQuestions = [
  {
    key: "nameConsistency",
    label: "Name consistency",
    help: "Has the person used the same name or clearly explained any variation?",
    weight: 10,
    options: [
      {
        value: "consistent",
        label: "Consistent or clearly explained",
        score: 0,
      },
      {
        value: "minor_inconsistency",
        label: "Minor unexplained variation",
        score: 35,
      },
      {
        value: "major_inconsistency",
        label: "Major contradiction or different identity",
        score: 85,
      },
      {
        value: "unknown",
        label: "Unknown or not enough information",
        score: null,
      },
    ],
  },
  {
    key: "ageConsistency",
    label: "Age consistency",
    help: "Are statements, photos, and timelines reasonably consistent with the claimed age?",
    weight: 10,
    options: [
      { value: "consistent", label: "Consistent", score: 0 },
      { value: "minor_inconsistency", label: "Minor inconsistency", score: 35 },
      { value: "major_inconsistency", label: "Major contradiction", score: 85 },
      {
        value: "unknown",
        label: "Unknown or not enough information",
        score: null,
      },
    ],
  },
  {
    key: "locationConsistency",
    label: "Location consistency",
    help: "Do time zone, local details, travel explanations, and stated location fit together?",
    weight: 12,
    options: [
      { value: "consistent", label: "Consistent", score: 0 },
      { value: "minor_inconsistency", label: "Minor inconsistency", score: 35 },
      { value: "major_inconsistency", label: "Major contradiction", score: 85 },
      {
        value: "unknown",
        label: "Unknown or not enough information",
        score: null,
      },
    ],
  },
  {
    key: "occupationConsistency",
    label: "Occupation consistency",
    help: "Are job duties, schedule, employer details, and career history internally consistent?",
    weight: 10,
    options: [
      { value: "consistent", label: "Consistent", score: 0 },
      { value: "minor_inconsistency", label: "Minor inconsistency", score: 35 },
      { value: "major_inconsistency", label: "Major contradiction", score: 85 },
      {
        value: "unknown",
        label: "Unknown or not enough information",
        score: null,
      },
    ],
  },
  {
    key: "familyConsistency",
    label: "Family and relationship claims",
    help: "Are claims about family, marital status, children, and prior relationships consistent over time?",
    weight: 8,
    options: [
      { value: "consistent", label: "Consistent", score: 0 },
      { value: "minor_inconsistency", label: "Minor inconsistency", score: 35 },
      { value: "major_inconsistency", label: "Major contradiction", score: 85 },
      {
        value: "unknown",
        label: "Unknown or not enough information",
        score: null,
      },
    ],
  },
  {
    key: "timelineConsistency",
    label: "Communication and life timeline",
    help: "Do dates, trips, major events, and the relationship timeline remain consistent?",
    weight: 10,
    options: [
      { value: "consistent", label: "Consistent", score: 0 },
      { value: "minor_inconsistency", label: "Minor inconsistency", score: 35 },
      { value: "major_inconsistency", label: "Major contradiction", score: 85 },
      {
        value: "unknown",
        label: "Unknown or not enough information",
        score: null,
      },
    ],
  },
  {
    key: "socialProfileHistory",
    label: "Social-profile history",
    help: "How established and internally consistent are the person's social profiles?",
    weight: 10,
    options: [
      {
        value: "established",
        label: "Established and reasonably consistent",
        score: 0,
      },
      {
        value: "limited",
        label: "Limited history or sparse activity",
        score: 45,
      },
      {
        value: "recently_created",
        label: "Recently created or repeatedly replaced",
        score: 75,
      },
      {
        value: "absent",
        label: "No profile history when one would reasonably be expected",
        score: 60,
      },
      {
        value: "unknown",
        label: "Unknown or not enough information",
        score: null,
      },
    ],
  },
  {
    key: "financialRequests",
    label: "Money, gifts, or investment requests",
    help: "Has the person requested money, gift cards, cryptocurrency, account access, or financial help?",
    weight: 15,
    options: [
      { value: "none", label: "No financial request", score: 0 },
      {
        value: "indirect",
        label: "Indirect hints or repeated hardship stories",
        score: 40,
      },
      {
        value: "direct",
        label: "Direct request for money, gifts, or investment",
        score: 75,
      },
      {
        value: "repeated",
        label: "Repeated, urgent, secretive, or escalating requests",
        score: 95,
      },
      {
        value: "unknown",
        label: "Unknown or not enough information",
        score: null,
      },
    ],
  },
  {
    key: "verificationCooperation",
    label: "Verification cooperation",
    help: "How willing is the person to answer ordinary questions and complete reasonable verification steps?",
    weight: 15,
    options: [
      { value: "cooperative", label: "Cooperative and consistent", score: 0 },
      {
        value: "partial",
        label: "Partly cooperative but evasive at times",
        score: 40,
      },
      {
        value: "avoids",
        label: "Frequently avoids or delays verification",
        score: 75,
      },
      {
        value: "refuses",
        label: "Refuses, becomes hostile, or changes the subject",
        score: 95,
      },
      {
        value: "unknown",
        label: "Unknown or not enough information",
        score: null,
      },
    ],
  },
] as const;

export type ProfileQuestion = (typeof profileQuestions)[number];
export type ProfileQuestionKey = ProfileQuestion["key"];
