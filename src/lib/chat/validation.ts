import { z } from "zod";

import { CHAT_MAX_CHARACTERS, CHAT_MIN_CHARACTERS } from "./constants";

function checkboxAccepted(message: string) {
  return z.literal("on", { error: message });
}

export const chatSubmissionSchema = z.object({
  caseId: z.string().uuid("The case identifier is invalid."),
  conversationText: z
    .string()
    .trim()
    .min(
      CHAT_MIN_CHARACTERS,
      `Add at least ${CHAT_MIN_CHARACTERS} characters so the submission has enough context.`,
    )
    .max(
      CHAT_MAX_CHARACTERS,
      `Keep this submission at or below ${CHAT_MAX_CHARACTERS.toLocaleString()} characters.`,
    ),
  processingConsentAcknowledged: checkboxAccepted(
    "Confirm that you understand the text will be stored privately and processed by AI in a later build.",
  ),
  sensitiveDataReviewed: checkboxAccepted(
    "Confirm that you removed unnecessary passwords, account numbers, addresses, and intimate material.",
  ),
});

export function firstFieldErrors(error: z.ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>;
}
