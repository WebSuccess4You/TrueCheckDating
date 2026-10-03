import { z } from "zod";

import {
  IMAGE_NOTES_MAX_CHARACTERS,
  IMAGE_SOURCE_LINK_MAX_CHARACTERS,
  imageResultOptions,
} from "./constants";

const optionalTrimmed = (max: number) =>
  z.preprocess((value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }, z.string().max(max).optional());

export const safeSourceUrlSchema = optionalTrimmed(
  IMAGE_SOURCE_LINK_MAX_CHARACTERS,
).superRefine((value, context) => {
  if (!value) return;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    context.addIssue({
      code: "custom",
      message:
        "Enter a complete web address beginning with http:// or https://.",
    });
    return;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    context.addIssue({
      code: "custom",
      message: "Only http:// and https:// source links are allowed.",
    });
  }

  if (url.username || url.password) {
    context.addIssue({
      code: "custom",
      message: "Source links cannot contain embedded usernames or passwords.",
    });
  }
});

const resultValues = imageResultOptions.map((option) => option.value) as [
  (typeof imageResultOptions)[number]["value"],
  ...(typeof imageResultOptions)[number]["value"][],
];

export const imageCheckFormSchema = z
  .object({
    caseId: z.string().uuid(),
    intent: z.enum(["save", "complete", "unavailable"]),
    resultCategory: z.preprocess(
      (value) => (value === "" ? undefined : value),
      z.enum(resultValues).optional(),
    ),
    sourceLink1: safeSourceUrlSchema,
    sourceLink2: safeSourceUrlSchema,
    sourceLink3: safeSourceUrlSchema,
    notes: optionalTrimmed(IMAGE_NOTES_MAX_CHARACTERS),
    safetyAcknowledged: z.preprocess(
      (value) => value === "on" || value === "true" || value === true,
      z.boolean(),
    ),
  })
  .superRefine((value, context) => {
    if (value.intent !== "complete") return;

    if (!value.resultCategory) {
      context.addIssue({
        code: "custom",
        path: ["resultCategory"],
        message: "Choose the result that best matches what you found.",
      });
    }

    if (!value.safetyAcknowledged) {
      context.addIssue({
        code: "custom",
        path: ["safetyAcknowledged"],
        message:
          "Confirm that you understand the result is a clue, not proof, and will not use it to harass or publicly accuse anyone.",
      });
    }
  });

export function firstFieldErrors(error: z.ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>;
}
