export type AccountDeletionActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialAccountDeletionActionState: AccountDeletionActionState = {
  status: "idle",
};

export type AccountDeletionStatus =
  "queued" | "processing" | "completed" | "failed";

export type AccountDeletionReceipt = {
  status: AccountDeletionStatus;
  requestedAt: string;
  completedAt: string | null;
  failedAt: string | null;
  membershipCancellationCount: number;
};
