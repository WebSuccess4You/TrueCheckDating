export const ACCOUNT_DELETION_CONFIRMATION = "DELETE MY ACCOUNT";
export const ACCOUNT_DELETION_SCHEMA_VERSION = "1.0";
export const ACCOUNT_DELETION_STATUS_TOKEN_BYTES = 32;

export const CANCELLABLE_SUBSCRIPTION_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
] as const;
