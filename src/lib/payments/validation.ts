import { z } from "zod";

import { PAYMENT_PRODUCT_CODES } from "./constants";

export const checkoutRequestSchema = z
  .object({
    productCode: z.enum(PAYMENT_PRODUCT_CODES),
    caseId: z.string().uuid().optional(),
  })
  .superRefine((value, context) => {
    if (value.productCode === "one_time_report" && !value.caseId) {
      context.addIssue({
        code: "custom",
        path: ["caseId"],
        message: "A case is required for an individual report purchase.",
      });
    }
  });

export function safeInternalCaseResultsPath(caseId: string): string {
  const parsed = z.string().uuid().safeParse(caseId);
  return parsed.success ? `/cases/${parsed.data}/results` : "/dashboard";
}
