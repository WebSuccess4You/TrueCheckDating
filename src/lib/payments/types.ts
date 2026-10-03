export type PaymentProductCode = "one_time_report" | "monthly_membership";

export type CheckoutActionState = {
  status: "idle" | "error";
  message?: string;
};

export type BillingActionState = CheckoutActionState;

export type EntitlementSummary = {
  hasFullReportAccess: boolean;
  source: "case_purchase" | "membership" | null;
  caseEntitlementEndsAt: string | null;
  membershipStatus: string | null;
  membershipEndsAt: string | null;
  usageLimit: number | null;
  usageCount: number;
};

export type SubscriptionSummary = {
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  providerCustomerId: string;
} | null;
