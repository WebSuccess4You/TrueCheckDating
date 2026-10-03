import type { CaseStatus } from "./types";

export function formatCaseDate(value: string | null | undefined): string {
  if (!value) return "Not provided";

  const date =
    value.length === 10 ? new Date(`${value}T12:00:00Z`) : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not provided";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);
}

export function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function readableCaseStatus(status: CaseStatus): string {
  return status === "archived" ? "Archived" : "Active";
}
