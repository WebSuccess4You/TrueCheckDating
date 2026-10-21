export const ONE_TIME_REPORT_PRODUCT_CODE = "one_time_report" as const;
export const MONTHLY_MEMBERSHIP_PRODUCT_CODE = "monthly_membership" as const;

export const PAYMENT_PRODUCT_CODES = [
  ONE_TIME_REPORT_PRODUCT_CODE,
  MONTHLY_MEMBERSHIP_PRODUCT_CODE,
] as const;

export const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
]);

export const FULL_REPORT_GENERATION_LIMIT = 4;
export const FULL_REPORT_WINDOW_DAYS = 30;
export const MEMBERSHIP_ACTIVE_CASE_LIMIT = 5;
export const MEMBERSHIP_ANALYSIS_LIMIT = 20;
export const MEMBERSHIP_REPORT_LIMIT = 20;
