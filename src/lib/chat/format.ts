import type { ChatSubmissionStatus } from "./types";

export function formatSubmissionDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function readableSubmissionStatus(status: ChatSubmissionStatus): string {
  const labels: Record<ChatSubmissionStatus, string> = {
    stored: "Stored privately",
    pending_ai_connection: "Ready for analysis",
    analysis_processing: "Analysis processing",
    analysis_completed: "Analysis completed",
    analysis_failed: "Analysis needs retry",
  };
  return labels[status];
}
