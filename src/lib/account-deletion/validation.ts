import { z } from "zod";

import { ACCOUNT_DELETION_CONFIRMATION } from "./constants";

export const accountDeletionSchema = z.object({
  currentPassword: z
    .string()
    .min(1, "Enter your current password.")
    .max(128, "Password is too long."),
  confirmation: z
    .string()
    .trim()
    .refine((value) => value === ACCOUNT_DELETION_CONFIRMATION, {
      message: `Type ${ACCOUNT_DELETION_CONFIRMATION} exactly.`,
    }),
  consequencesAcknowledged: z.literal("on", {
    error: "Confirm that you understand this deletion is permanent.",
  }),
});
