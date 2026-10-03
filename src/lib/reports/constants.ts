export const REPORT_SCHEMA_VERSION = "1.0";
export const REPORT_CONTENT_VERSION = "2026-09-28.1";

export const DEFAULT_REPORT_RECOMMENDATIONS = [
  {
    priority: "high" as const,
    action:
      "Pause any money transfer, investment, gift-card purchase, or account sharing until important claims are independently verified.",
    reason:
      "Financial urgency and secrecy can create irreversible losses before facts are checked.",
  },
  {
    priority: "high" as const,
    action:
      "Use an ordinary live video conversation and reasonable live verification before travel or major commitments.",
    reason:
      "Live cooperation can reduce uncertainty, although it cannot prove identity by itself.",
  },
  {
    priority: "moderate" as const,
    action:
      "Review the evidence with a trusted person who is outside the relationship.",
    reason:
      "An independent person may notice pressure, contradictions, or missing information more easily.",
  },
] as const;
