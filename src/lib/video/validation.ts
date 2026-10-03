import { z } from "zod";

import { VIDEO_NOTES_MAX_CHARACTERS, videoQuestions } from "./constants";

const optionalTrimmed = (max: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }, z.string().max(max).optional());

const shape: Record<string, z.ZodTypeAny> = {
  caseId: z.string().uuid(),
  intent: z.enum(["save", "complete"]),
  notes: optionalTrimmed(VIDEO_NOTES_MAX_CHARACTERS),
  safetyAcknowledged: z.preprocess(
    (value) => value === "on" || value === "true" || value === true,
    z.boolean(),
  ),
};

for (const question of videoQuestions) {
  const values = question.options.map((option) => option.value) as [
    string,
    ...string[],
  ];
  shape[question.key] = z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.enum(values).optional(),
  );
}

export const videoCheckFormSchema = z
  .object(shape)
  .superRefine((value, context) => {
    if (value.intent !== "complete") return;

    for (const question of videoQuestions) {
      if (!value[question.key]) {
        context.addIssue({
          code: "custom",
          path: [question.key],
          message: "Choose an answer, including ‘Unknown’ when needed.",
        });
      }
    }

    if (!value.safetyAcknowledged) {
      context.addIssue({
        code: "custom",
        path: ["safetyAcknowledged"],
        message:
          "Confirm that this checklist records observations, does not prove identity, and will not be used for secret or unlawful recording.",
      });
    }
  });

export function firstFieldErrors(error: z.ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>;
}
