import "server-only";

import { randomUUID } from "node:crypto";

import Stripe from "stripe";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeEnvironment } from "@/lib/server-env";

import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  FULL_REPORT_REANALYSIS_LIMIT,
  FULL_REPORT_WINDOW_DAYS,
  MEMBERSHIP_ANALYSIS_LIMIT,
  MONTHLY_MEMBERSHIP_PRODUCT_CODE,
  ONE_TIME_REPORT_PRODUCT_CODE,
} from "./constants";
import { getStripeClient } from "./stripe";

function unixToIso(value: number | null | undefined): string | null {
  return value ? new Date(value * 1000).toISOString() : null;
}

function addDaysIso(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function metadataValue(
  metadata: Stripe.Metadata | null | undefined,
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

async function getProductId(code: string): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("products")
    .select("id")
    .eq("code", code)
    .single();
  if (error || !data) throw new Error(`Payment product ${code} is missing.`);
  return data.id;
}

async function markEvent(
  event: Stripe.Event,
  claimToken: string,
): Promise<"new" | "completed" | "processing"> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("reserve_stripe_webhook_event", {
    p_event_id: event.id,
    p_event_type: event.type,
    p_claim_token: claimToken,
  });
  if (error || !["new", "completed", "processing"].includes(data)) {
    throw new Error("Could not reserve Stripe event processing.");
  }
  return data;
}

async function completeEvent(
  event: Stripe.Event,
  claimToken: string,
): Promise<void> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("stripe_webhook_events")
    .update({
      processing_status: "completed",
      processed_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("provider_event_id", event.id)
    .eq("claim_token", claimToken)
    .eq("processing_status", "processing")
    .select("provider_event_id")
    .maybeSingle();
  if (error || !data) throw new Error("Could not complete Stripe event claim.");
}

async function failEvent(
  event: Stripe.Event,
  claimToken: string,
  error: unknown,
): Promise<void> {
  const admin = createAdminClient();
  const message =
    error instanceof Error ? error.message.slice(0, 500) : "Unknown error";
  await admin
    .from("stripe_webhook_events")
    .update({
      processing_status: "failed",
      processed_at: new Date().toISOString(),
      error_message: message,
    })
    .eq("provider_event_id", event.id)
    .eq("claim_token", claimToken)
    .eq("processing_status", "processing");
}

async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const admin = createAdminClient();
  const userId = metadataValue(session.metadata, "user_id");
  const caseId = metadataValue(session.metadata, "case_id");
  const productCode = metadataValue(session.metadata, "product_code");
  if (!userId || !productCode) {
    throw new Error(
      "Checkout session is missing trusted fulfillment metadata.",
    );
  }

  const productId = await getProductId(productCode);
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  if (customerId) {
    const { error: customerError } = await admin
      .from("payment_customers")
      .upsert(
        {
          user_id: userId,
          provider: "stripe",
          provider_customer_id: customerId,
        },
        { onConflict: "user_id,provider" },
      );
    if (customerError) throw new Error("Could not record payment customer.");
  }

  if (session.mode === "payment") {
    if (
      session.payment_status !== "paid" ||
      productCode !== ONE_TIME_REPORT_PRODUCT_CODE ||
      !caseId
    ) {
      return;
    }
    const { data: ownedCase } = await admin
      .from("cases")
      .select("id")
      .eq("id", caseId)
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!ownedCase) {
      throw new Error("Paid report metadata does not match an owned case.");
    }
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? null);
    const { data: previousPayment, error: previousPaymentError } = await admin
      .from("payments")
      .select("status")
      .eq("provider_checkout_session_id", session.id)
      .maybeSingle();
    if (previousPaymentError)
      throw new Error("Could not check report purchase.");
    if (previousPayment?.status === "refunded") return;

    const { data: payment, error: paymentError } = await admin
      .from("payments")
      .upsert(
        {
          user_id: userId,
          case_id: caseId,
          product_id: productId,
          provider: "stripe",
          provider_checkout_session_id: session.id,
          provider_payment_id: paymentIntentId,
          status: "paid",
          amount_minor_units: session.amount_total ?? 0,
          currency: session.currency ?? "usd",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "provider_checkout_session_id" },
      )
      .select("id")
      .single();
    if (paymentError || !payment)
      throw new Error("Could not record paid report purchase.");

    const { data: existingEntitlement } = await admin
      .from("entitlements")
      .select("id")
      .eq("source_type", "payment")
      .eq("source_id", payment.id)
      .eq("entitlement_type", "case_full_report")
      .eq("case_id", caseId)
      .maybeSingle();
    const entitlementPayload = {
      user_id: userId,
      case_id: caseId,
      entitlement_type: "case_full_report",
      source_type: "payment",
      source_id: payment.id,
      starts_at: new Date().toISOString(),
      ends_at: addDaysIso(FULL_REPORT_WINDOW_DAYS),
      usage_limit: FULL_REPORT_REANALYSIS_LIMIT,
      usage_count: 0,
      status: "active",
      metadata: { checkout_session_id: session.id },
      updated_at: new Date().toISOString(),
    };
    // A second event for the same checkout must not reset usage or revive a
    // refunded purchase. A previous partial attempt can still insert it.
    const entitlementResult = existingEntitlement
      ? null
      : await admin.from("entitlements").insert(entitlementPayload);
    if (entitlementResult?.error) {
      const { data: concurrentEntitlement } = await admin
        .from("entitlements")
        .select("id")
        .eq("source_type", "payment")
        .eq("source_id", payment.id)
        .eq("entitlement_type", "case_full_report")
        .eq("case_id", caseId)
        .maybeSingle();
      if (!concurrentEntitlement)
        throw new Error("Could not grant report entitlement.");
    }
  }
}

async function recordFailedCheckoutSession(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const admin = createAdminClient();
  const userId = metadataValue(session.metadata, "user_id");
  const caseId = metadataValue(session.metadata, "case_id");
  const productCode = metadataValue(session.metadata, "product_code");
  if (!userId || !productCode) return;
  const productId = await getProductId(productCode);
  const { data: previousPayment, error: previousPaymentError } = await admin
    .from("payments")
    .select("status")
    .eq("provider_checkout_session_id", session.id)
    .maybeSingle();
  if (previousPaymentError) throw new Error("Could not check report purchase.");
  if (
    previousPayment?.status === "paid" ||
    previousPayment?.status === "refunded"
  )
    return;
  const { error: failedPaymentError } = await admin.from("payments").upsert(
    {
      user_id: userId,
      case_id: caseId,
      product_id: productId,
      provider: "stripe",
      provider_checkout_session_id: session.id,
      provider_payment_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null),
      status: "failed",
      amount_minor_units: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider_checkout_session_id" },
  );
  if (failedPaymentError) throw new Error("Could not record failed checkout.");
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const value = invoice as Stripe.Invoice & {
    subscription?: string | { id: string } | null;
    parent?: {
      subscription_details?: {
        subscription?: string | { id: string } | null;
      } | null;
    } | null;
  };
  const subscription =
    value.subscription ?? value.parent?.subscription_details?.subscription;
  if (typeof subscription === "string") return subscription;
  return subscription?.id ?? null;
}

async function refreshInvoiceSubscription(
  invoice: Stripe.Invoice,
): Promise<void> {
  const subscriptionId = invoiceSubscriptionId(invoice);
  if (!subscriptionId) return;
  const subscription =
    await getStripeClient().subscriptions.retrieve(subscriptionId);
  await synchronizeSubscription(subscription);
}

function subscriptionPeriod(subscription: Stripe.Subscription): {
  start: string | null;
  end: string | null;
} {
  const legacy = subscription as Stripe.Subscription & {
    current_period_start?: number;
    current_period_end?: number;
  };
  const item = subscription.items.data[0] as Stripe.SubscriptionItem & {
    current_period_start?: number;
    current_period_end?: number;
  };
  return {
    start: unixToIso(legacy.current_period_start ?? item.current_period_start),
    end: unixToIso(legacy.current_period_end ?? item.current_period_end),
  };
}

async function synchronizeSubscription(
  subscription: Stripe.Subscription,
): Promise<void> {
  const userId = metadataValue(subscription.metadata, "user_id");
  const productCode =
    metadataValue(subscription.metadata, "product_code") ??
    MONTHLY_MEMBERSHIP_PRODUCT_CODE;
  if (!userId)
    throw new Error("Subscription is missing the TrueCheckDating.com user ID.");

  const admin = createAdminClient();
  const { data: existingProfile } = await admin
    .from("user_profiles")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();
  if (!existingProfile) {
    // A Stripe cancellation event can arrive after Build 13 has already
    // deleted the account. Treat it as successfully irrelevant rather than
    // recreating user-linked billing records or failing the webhook.
    return;
  }

  const productId = await getProductId(productCode);
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const period = subscriptionPeriod(subscription);

  const { data: record, error } = await admin
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        product_id: productId,
        provider: "stripe",
        provider_customer_id: customerId,
        provider_subscription_id: subscription.id,
        status: subscription.status,
        current_period_start: period.start,
        current_period_end: period.end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "provider_subscription_id" },
    )
    .select("id")
    .single();
  if (error || !record) throw new Error("Could not synchronize subscription.");

  const entitlementStatus = ACTIVE_SUBSCRIPTION_STATUSES.has(
    subscription.status,
  )
    ? "active"
    : "inactive";
  const { data: existingEntitlement } = await admin
    .from("entitlements")
    .select("id")
    .eq("source_type", "subscription")
    .eq("source_id", record.id)
    .eq("entitlement_type", "membership")
    .maybeSingle();
  const entitlementPayload = {
    user_id: userId,
    case_id: null,
    entitlement_type: "membership",
    source_type: "subscription",
    source_id: record.id,
    starts_at: period.start ?? new Date().toISOString(),
    ends_at: period.end,
    usage_limit: MEMBERSHIP_ANALYSIS_LIMIT,
    status: entitlementStatus,
    metadata: { provider_subscription_id: subscription.id },
    updated_at: new Date().toISOString(),
  };
  const entitlementResult = existingEntitlement
    ? await admin
        .from("entitlements")
        .update(entitlementPayload)
        .eq("id", existingEntitlement.id)
    : await admin.from("entitlements").insert({
        ...entitlementPayload,
        usage_count: 0,
      });
  if (entitlementResult.error) {
    const { data: concurrentEntitlement } = await admin
      .from("entitlements")
      .select("id")
      .eq("source_type", "subscription")
      .eq("source_id", record.id)
      .eq("entitlement_type", "membership")
      .maybeSingle();
    if (!concurrentEntitlement) {
      throw new Error("Could not synchronize membership entitlement.");
    }
  }
}

async function handleRefund(charge: Stripe.Charge): Promise<void> {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;
  if (!paymentIntentId || !charge.refunded) return;
  const admin = createAdminClient();
  const { data: payment, error: paymentError } = await admin
    .from("payments")
    .update({ status: "refunded", updated_at: new Date().toISOString() })
    .eq("provider_payment_id", paymentIntentId)
    .select("id")
    .maybeSingle();
  if (paymentError) throw new Error("Could not record refunded payment.");
  if (payment) {
    const { error: revocationError } = await admin
      .from("entitlements")
      .update({ status: "revoked", updated_at: new Date().toISOString() })
      .eq("source_type", "payment")
      .eq("source_id", payment.id);
    if (revocationError) throw new Error("Could not revoke refunded access.");
  }
}

export function constructStripeEvent(
  payload: string,
  signature: string,
): Stripe.Event {
  const { webhookSecret } = getStripeEnvironment();
  return getStripeClient().webhooks.constructEvent(
    payload,
    signature,
    webhookSecret,
  );
}

export async function processStripeEvent(
  event: Stripe.Event,
): Promise<"processed" | "duplicate"> {
  const claimToken = randomUUID();
  const reservation = await markEvent(event, claimToken);
  if (reservation !== "new") return "duplicate";

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        await fulfillCheckoutSession(event.data.object);
        break;
      case "checkout.session.async_payment_failed":
        await recordFailedCheckoutSession(event.data.object);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await synchronizeSubscription(event.data.object);
        break;
      case "invoice.paid":
      case "invoice.payment_failed":
        await refreshInvoiceSubscription(event.data.object);
        break;
      case "charge.refunded":
        await handleRefund(event.data.object);
        break;
      default:
        break;
    }
    await completeEvent(event, claimToken);
    return "processed";
  } catch (error) {
    await failEvent(event, claimToken, error);
    throw error;
  }
}
