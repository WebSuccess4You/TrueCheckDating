import { z } from "zod";

import { PROFILE_NOTES_MAX_CHARACTERS, profileQuestions } from "./constants";

const optionalTrimmed = (max: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }, z.string().max(max).optional());

const answerShape = Object.fromEntries(
  profileQuestions.map((question) => [
    question.key,
    z.preprocess(
      (value) => (value === "" ? undefined : value),
      z
        .enum(
          question.options.map((option) => option.value) as [
            string,
            ...string[],
          ],
        )
        .optional(),
    ),
  ]),
) as Record<string, z.ZodTypeAny>;

export const profileCheckFormSchema = z
  .object({
    caseId: z.string().uuid(),
    intent: z.enum(["save", "complete"]),
    ...answerShape,
    notes: optionalTrimmed(PROFILE_NOTES_MAX_CHARACTERS),
  })
  .superRefine((value, context) => {
    if (value.intent !== "complete") return;
    const answers = value as Record<string, unknown>;

    for (const question of profileQuestions) {
      if (!answers[question.key]) {
        context.addIssue({
          code: "custom",
          path: [question.key],
          message:
            "Choose an answer, including ‘Unknown,’ before completing the check.",
        });
      }
    }
  });

export function firstFieldErrors(error: z.ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>;
}
