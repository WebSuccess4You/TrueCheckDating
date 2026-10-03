export const VIDEO_CHECK_VERSION = "2026-06-18.1";
export const VIDEO_NOTES_MAX_CHARACTERS = 2_000;

export const videoQuestions = [
  {
    key: "liveCallStatus",
    label: "Live-call history",
    help: "What kind of live video interaction has actually occurred?",
    weight: 22,
    options: [
      {
        value: "multiple_clear_calls",
        label: "Several clear, natural live calls",
        score: 0,
        protective: "Several natural live calls were completed.",
      },
      {
        value: "one_clear_call",
        label: "One clear, natural live call",
        score: 10,
        protective: "A clear live call was completed.",
      },
      {
        value: "brief_or_unclear",
        label: "A brief, obstructed, or unclear call",
        score: 45,
        concern:
          "The video interaction was too brief or unclear for ordinary verification.",
      },
      {
        value: "requested_once_avoided",
        label: "Requested once but did not happen",
        score: 65,
        concern: "A requested live call did not occur.",
      },
      {
        value: "requested_repeatedly_avoided",
        label: "Requested repeatedly but consistently avoided",
        score: 90,
        concern: "Repeated requests for a live call were consistently avoided.",
        severe: true,
      },
      {
        value: "not_requested",
        label: "Not requested yet or not enough information",
        score: null,
      },
    ],
  },
  {
    key: "avoidancePattern",
    label: "Avoidance explanations",
    help: "How consistent and plausible were any explanations for not appearing on video?",
    weight: 15,
    options: [
      {
        value: "none",
        label: "No avoidance pattern",
        score: 0,
        protective: "No repeated video-call avoidance pattern was recorded.",
      },
      {
        value: "single_plausible",
        label: "One plausible delay or technical problem",
        score: 25,
      },
      {
        value: "repeated_technical",
        label: "Repeated technical, camera, or connection problems",
        score: 60,
        concern:
          "Technical or camera problems were repeatedly used to prevent a clear call.",
      },
      {
        value: "changing_excuses",
        label: "Changing, contradictory, or escalating excuses",
        score: 85,
        concern:
          "The explanations for avoiding video changed or contradicted one another.",
        severe: true,
      },
      {
        value: "unknown",
        label: "Unknown or not enough information",
        score: null,
      },
    ],
  },
  {
    key: "liveMovementAndAudio",
    label: "Live movement and audio",
    help: "Did movement, speech, timing, and the surrounding interaction appear naturally live?",
    weight: 15,
    options: [
      {
        value: "natural_live",
        label: "Natural movement, speech, and timing",
        score: 0,
        protective: "Movement and audio appeared naturally live.",
      },
      {
        value: "partly_unclear",
        label: "Partly unclear, frozen, muted, or obstructed",
        score: 45,
        concern:
          "Important parts of the interaction were unclear or obstructed.",
      },
      {
        value: "prerecorded_or_out_of_sync",
        label: "Appeared prerecorded, looped, or badly out of sync",
        score: 90,
        concern:
          "The interaction appeared prerecorded, looped, or inconsistent with a live call.",
        severe: true,
      },
      {
        value: "not_observed",
        label: "Not observed or not enough information",
        score: null,
      },
    ],
  },
  {
    key: "simpleLiveVerification",
    label: "Simple live verification request",
    help: "When a normal, respectful live action was requested, how did the person respond?",
    weight: 15,
    options: [
      {
        value: "completed",
        label: "Completed a simple live action naturally",
        score: 0,
        protective: "A simple live action was completed naturally.",
      },
      {
        value: "partly_completed",
        label: "Partly completed but remained unclear",
        score: 35,
      },
      {
        value: "avoided",
        label: "Avoided, delayed, or redirected the request",
        score: 70,
        concern:
          "A reasonable live verification request was avoided or redirected.",
      },
      {
        value: "refused_or_hostile",
        label: "Refused or became hostile about the request",
        score: 95,
        concern:
          "A reasonable live verification request triggered refusal or hostility.",
        severe: true,
      },
      {
        value: "not_requested",
        label: "Not requested or not enough information",
        score: null,
      },
    ],
  },
  {
    key: "cameraProblemPattern",
    label: "Camera-problem pattern",
    help: "Were camera failures isolated, or did they repeatedly prevent clear verification?",
    weight: 10,
    options: [
      {
        value: "none",
        label: "No meaningful camera problem",
        score: 0,
        protective: "No repeated camera-problem pattern was recorded.",
      },
      {
        value: "isolated",
        label: "One isolated technical problem",
        score: 25,
      },
      {
        value: "repeated",
        label: "Repeated camera failures or very poor visibility",
        score: 65,
        concern:
          "Repeated camera problems prevented ordinary visual verification.",
      },
      {
        value: "always_unavailable",
        label: "Camera is always unavailable, broken, or forbidden",
        score: 85,
        concern:
          "The camera was consistently unavailable whenever verification was requested.",
        severe: true,
      },
      {
        value: "unknown",
        label: "Unknown or not enough information",
        score: null,
      },
    ],
  },
  {
    key: "financialPressureAroundCalls",
    label: "Financial or emotional pressure around calls",
    help: "Was money, investment, secrecy, guilt, or urgency used before or after a failed verification attempt?",
    weight: 10,
    options: [
      {
        value: "none",
        label: "No pressure connected to the calls",
        score: 0,
        protective:
          "No financial or emotional pressure was connected to the calls.",
      },
      {
        value: "indirect",
        label: "Indirect hardship, guilt, or urgency",
        score: 35,
        concern:
          "Indirect pressure or hardship claims appeared around verification attempts.",
      },
      {
        value: "direct",
        label: "Direct money, gift, investment, or secrecy request",
        score: 75,
        concern:
          "A direct financial or secrecy request appeared around verification attempts.",
        severe: true,
      },
      {
        value: "urgent_or_threatening",
        label: "Urgent, repeated, threatening, or coercive pressure",
        score: 95,
        concern:
          "Urgent or coercive pressure was connected to failed verification attempts.",
        severe: true,
      },
      {
        value: "unknown",
        label: "Unknown or not enough information",
        score: null,
      },
    ],
  },
  {
    key: "appearanceAndClaims",
    label: "Appearance and stated identity",
    help: "Were appearance, age range, voice, surroundings, and stated circumstances reasonably consistent?",
    weight: 8,
    options: [
      {
        value: "consistent",
        label: "Reasonably consistent",
        score: 0,
        protective:
          "Visible details were reasonably consistent with the stated identity and circumstances.",
      },
      {
        value: "minor_discrepancy",
        label: "Minor unexplained discrepancy",
        score: 35,
        concern: "A minor discrepancy was observed during the call.",
      },
      {
        value: "major_mismatch",
        label: "Major mismatch or different person",
        score: 90,
        concern:
          "A major mismatch was observed between the live interaction and the claimed identity or circumstances.",
        severe: true,
      },
      {
        value: "not_observed",
        label: "Not observed or not enough information",
        score: null,
      },
    ],
  },
  {
    key: "boundaryRespect",
    label: "Respect for boundaries",
    help: "Did the person respect a calm request for verification and your decision to pause or decline?",
    weight: 5,
    options: [
      {
        value: "respected",
        label: "Respected ordinary boundaries",
        score: 0,
        protective:
          "Ordinary verification and safety boundaries were respected.",
      },
      {
        value: "mixed",
        label: "Mixed, defensive, or dismissive response",
        score: 40,
        concern:
          "The response to ordinary safety boundaries was mixed or dismissive.",
      },
      {
        value: "pressured_or_threatened",
        label: "Pressured, insulted, threatened, or retaliated",
        score: 90,
        concern:
          "The person pressured, insulted, threatened, or retaliated when safety boundaries were set.",
        severe: true,
      },
      {
        value: "unknown",
        label: "Unknown or not enough information",
        score: null,
      },
    ],
  },
] as const;

export type VideoQuestion = (typeof videoQuestions)[number];
export type VideoQuestionKey = VideoQuestion["key"];
