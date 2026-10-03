import type { ChatAnalysisStatus } from "./types";

export function readableConcernLevel(value: string | null): string {
  if (!value) return "Not available";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function readableAnalysisStatus(status: ChatAnalysisStatus): string {
  const labels: Record<ChatAnalysisStatus, string> = {
    queued: "Queued",
    processing: "Processing",
    completed: "Completed",
    failed: "Needs retry",
    rejected: "Not analyzed",
  };
  return labels[status];
}

export function readableCategory(category: string): string {
  return category
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
