import { z } from "zod";

const emailSchema = z.string().trim().email("Enter a valid email address.");
const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(128, "Password is too long.")
  .regex(/[a-z]/, "Include a lowercase letter.")
  .regex(/[A-Z]/, "Include an uppercase letter.")
  .regex(/[0-9]/, "Include a number.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
  next: z.string().optional(),
});

export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    adultConfirmed: z.literal("on", {
      error: "Confirm that you are at least 18 years old.",
    }),
    termsAccepted: z.literal("on", {
      error: "Accept the Terms of Service to continue.",
    }),
    privacyAccepted: z.literal("on", {
      error: "Accept the Privacy Policy to continue.",
    }),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const passwordResetRequestSchema = z.object({ email: emailSchema });

export const updatePasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type AuthFieldErrors = Record<string, string[] | undefined>;

export function firstFieldErrors(error: z.ZodError): AuthFieldErrors {
  return error.flatten().fieldErrors;
}
