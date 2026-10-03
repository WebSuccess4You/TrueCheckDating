import { z } from "zod";

export const supportLookupSchema = z
  .object({
    email: z.string().trim().email().optional(),
    userId: z.string().trim().uuid().optional(),
  })
  .refine((value) => Boolean(value.email || value.userId), {
    message: "Enter an exact account email or internal user ID.",
  });

export const accountStatusChangeSchema = z.object({
  targetUserId: z.string().uuid(),
  nextStatus: z.enum(["active", "suspended"]),
  reasonCode: z.enum([
    "support_review",
    "abuse_prevention",
    "billing_risk",
    "owner_request",
  ]),
});

export const resolveSystemErrorSchema = z.object({
  errorId: z.string().uuid(),
});
