"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/user";
import { getOwnedCase } from "@/lib/cases/queries";
import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  MONTHLY_MEMBERSHIP_PRODUCT_CODE,
  ONE_TIME_REPORT_PRODUCT_CODE,
} from "@/lib/payments/constants";
import {
  getEntitlementSummary,
  getSubscriptionSummary,
} from "@/lib/payments/queries";
import { getStripeClient } from "@/lib/payments/stripe";
import type {
  BillingActionState,
  CheckoutActionState,
} from "@/lib/payments/types";
import { checkoutRequestSchema } from "@/lib/payments/validation";
import { getLatestOwnedCaseAssessment } from "@/lib/scoring/queries";
import { checkoutEnabled } from "@/lib/operations/feature-switches";
import { getStripeEnvironment } from "@/lib/server-env";
import { createAdminClient } from "@/lib/supabase/admin";

function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry : "";
}

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

async function getOrCreateStripeCustomer(
  userId: string,
  email: string | undefined,
): Promise<string> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("payment_customers")
    .select("provider_customer_id")
    .eq("user_id", userId)
    .eq("provider", "stripe")
    .maybeSingle();
  if (existing?.provider_customer_id) return existing.provider_customer_id;

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email,
    metadata: { truecheck_user_id: userId },
  });
  const { error } = await admin.from("payment_customers").upsert(
    {
      user_id: userId,
      provider: "stripe",
      provider_customer_id: customer.id,
    },
    { onConflict: "user_id,provider" },
  );
  if (error) throw new Error("The Stripe customer record could not be saved.");
  return customer.id;
}

export async function createCheckoutSessionAction(
  _previousState: CheckoutActionState,
  formData: FormData,
): Promise<CheckoutActionState> {
  const parsed = checkoutRequestSchema.safeParse({
    productCode: value(formData, "productCode"),
    caseId: value(formData, "caseId") || undefined,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid checkout request.",
    };
  }

  const user = await requireUser();
  const { productCode, caseId } = parsed.data;

  if (!checkoutEnabled()) {
    return {
      status: "error",
      message:
        "New purchases are temporarily unavailable. Existing report access and billing management remain available.",
    };
  }

  if (caseId) {
    const caseRecord = await getOwnedCase(user.id, caseId);
    if (!caseRecord || caseRecord.status !== "active") {
      return {
        status: "error",
        message: "The selected case is unavailable for purchase.",
      };
    }
  }

  if (productCode === MONTHLY_MEMBERSHIP_PRODUCT_CODE) {
    const subscription = await getSubscriptionSummary(user.id);
    if (subscription && ACTIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
      redirect(
        "/account?message=An+active+membership+already+exists.+Use+the+billing+portal+to+manage+it.",
      );
    }
  }

  if (productCode === ONE_TIME_REPORT_PRODUCT_CODE && caseId) {
    const assessment = await getLatestOwnedCaseAssessment(user.id, caseId);
    if (!assessment || assessment.status !== "preliminary") {
      return {
        status: "error",
        message:
          "Calculate a preliminary combined result before purchasing the full report.",
      };
    }
    const entitlement = await getEntitlementSummary(user.id, caseId);
    if (entitlement.hasFullReportAccess) {
      redirect(
        `/cases/${caseId}/results?message=Full+report+access+is+already+active.`,
      );
    }
  }

  let checkoutUrl: string | null = null;
  try {
    const stripe = getStripeClient();
    const environment = getStripeEnvironment();
    const customerId = await getOrCreateStripeCustomer(user.id, user.email);
    const priceId =
      productCode === ONE_TIME_REPORT_PRODUCT_CODE
        ? environment.oneTimeReportPriceId
        : environment.monthlyMembershipPriceId;
    const successPath = caseId
      ? `/billing/success?caseId=${encodeURIComponent(caseId)}&session_id={CHECKOUT_SESSION_ID}`
      : "/billing/success?session_id={CHECKOUT_SESSION_ID}";
    const cancelPath = caseId
      ? `/cases/${caseId}/results?message=Checkout+was+canceled.+No+access+was+granted.`
      : "/account?message=Checkout+was+canceled.+No+access+was+granted.";
    const metadata = {
      user_id: user.id,
      case_id: caseId ?? "",
      product_code: productCode,
    };

    const session = await stripe.checkout.sessions.create({
      mode:
        productCode === MONTHLY_MEMBERSHIP_PRODUCT_CODE
          ? "subscription"
          : "payment",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl()}${successPath}`,
      cancel_url: `${appUrl()}${cancelPath}`,
      client_reference_id: user.id,
      metadata,
      allow_promotion_codes: false,
      billing_address_collection: "auto",
      ...(productCode === MONTHLY_MEMBERSHIP_PRODUCT_CODE
        ? { subscription_data: { metadata } }
        : { payment_intent_data: { metadata } }),
    });
    checkoutUrl = session.url;
  } catch {
    return {
      status: "error",
      message:
        "Secure checkout could not be started. Confirm the Build 11 Stripe test settings and try again.",
    };
  }

  if (!checkoutUrl) {
    return {
      status: "error",
      message: "Stripe did not return a checkout URL.",
    };
  }
  redirect(checkoutUrl);
}

export async function createBillingPortalAction(
  previousState: BillingActionState,
  formData: FormData,
): Promise<BillingActionState> {
  void previousState;
  void formData;
  const user = await requireUser();
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("payment_customers")
      .select("provider_customer_id")
      .eq("user_id", user.id)
      .eq("provider", "stripe")
      .maybeSingle();
    if (!data?.provider_customer_id) {
      return {
        status: "error",
        message: "No Stripe billing account exists for this user yet.",
      };
    }
    const stripe = getStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: data.provider_customer_id,
      return_url: `${appUrl()}/account`,
    });
    redirect(session.url);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    return {
      status: "error",
      message:
        "The billing portal could not be opened. Confirm Stripe test-mode configuration and try again.",
    };
  }
}
