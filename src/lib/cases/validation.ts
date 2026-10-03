import { z } from "zod";

const optionalTrimmed = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label} must be ${max} characters or fewer.`)
    .transform((value) => (value === "" ? undefined : value))
    .optional();

const dateString = z
  .string()
  .trim()
  .transform((value) => (value === "" ? undefined : value))
  .optional()
  .refine((value) => {
    if (!value) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parsed = new Date(`${value}T00:00:00Z`);
    return (
      Number.isFinite(parsed.getTime()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, "Enter a valid date.")
  .refine((value) => {
    if (!value) return true;
    const today = new Date().toISOString().slice(0, 10);
    return value <= today;
  }, "The communication start date cannot be in the future.");

export const caseDetailsSchema = z.object({
  privateNickname: z
    .string()
    .trim()
    .min(2, "Enter a private nickname with at least 2 characters.")
    .max(80, "The private nickname must be 80 characters or fewer."),
  communicationPlatform: optionalTrimmed(80, "The platform"),
  claimedNameOrAlias: optionalTrimmed(100, "The claimed name or alias"),
  claimedLocation: optionalTrimmed(120, "The claimed location"),
  communicationStartedOn: dateString,
});

export const createCaseSchema = caseDetailsSchema.extend({
  lawfulUseAcknowledged: z
    .string()
    .refine((value) => value === "on", "Confirm the lawful-use statement."),
});

export const updateCaseSchema = caseDetailsSchema.extend({
  caseId: z.string().uuid("The case identifier is invalid."),
});

export const caseStatusActionSchema = z.object({
  caseId: z.string().uuid("The case identifier is invalid."),
  status: z.enum(["active", "archived"]),
});

export const deleteCaseSchema = z.object({
  caseId: z.string().uuid("The case identifier is invalid."),
});

export function firstFieldErrors(error: z.ZodError): Record<string, string[]> {
  return error.flatten().fieldErrors as Record<string, string[]>;
}
