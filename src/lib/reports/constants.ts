export const REPORT_SCHEMA_VERSION = "1.0";
export const REPORT_CONTENT_VERSION = "2026-10-06.1";

export const DEFAULT_REPORT_RECOMMENDATIONS = [
  {
    priority: "moderate" as const,
    action:
      "Pause any money transfer, investment, gift-card purchase, or account sharing until important claims are independently verified.",
    reason:
      "General precaution: independently checking financial requests can help prevent losses. This recommendation does not mean financial pressure was found in this case.",
  },
  {
    priority: "moderate" as const,
    action:
      "Use an ordinary live video conversation and reasonable live verification before travel or major commitments.",
    reason:
      "General precaution: live cooperation can reduce uncertainty, although it cannot prove identity by itself. This recommendation does not mean video avoidance was found in this case.",
  },
  {
    priority: "moderate" as const,
    action:
      "Review the evidence with a trusted person who is outside the relationship.",
    reason:
      "General precaution: an independent person may help assess the available information and notice anything that needs clarification.",
  },
] as const;
