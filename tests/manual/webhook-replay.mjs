// Run locally with next dev running on port 3000:
// node --env-file=.env.local tests/manual/webhook-replay.mjs <disposable-user-id>
// Signs synthetic test events locally. It does not create a Stripe charge.
import { randomUUID } from "node:crypto";

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const userId = process.argv[2];
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const secret = process.env.STRIPE_WEBHOOK_SECRET;
if (!userId || !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(userId)) {
  throw new Error("Supply the disposable account's internal user ID.");
}
if (!url || !key || !secret)
  throw new Error("Local server credentials are unavailable.");

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const ids = { caseId: null, eventIds: [], sessionId: null, paymentId: null };

function unwrap(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

async function deliver(id, session) {
  const payload = JSON.stringify({
    id,
    object: "event",
    type: "checkout.session.completed",
    data: { object: session },
  });
  const signature = Stripe.webhooks.generateTestHeaderString({
    payload,
    secret,
  });
  const response = await fetch("http://localhost:3000/api/stripe/webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "stripe-signature": signature,
    },
    body: payload,
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(`Webhook returned HTTP ${response.status}.`);
  return body.status;
}

let failure;
try {
  const profile = unwrap(
    await db
      .from("user_profiles")
      .select("id,role,account_status")
      .eq("auth_user_id", userId)
      .single(),
    "Find disposable account",
  );
  if (profile.role !== "user" || profile.account_status !== "active") {
    throw new Error("The target must be an active disposable user account.");
  }
  const existingCases = unwrap(
    await db.from("cases").select("id").eq("auth_user_id", userId).limit(1),
    "Check existing cases",
  );
  if (existingCases.length)
    throw new Error("The disposable account has an existing case.");

  const testCase = unwrap(
    await db
      .from("cases")
      .insert({
        owner_profile_id: profile.id,
        auth_user_id: userId,
        private_nickname: "Build 15 disposable webhook replay",
        lawful_use_acknowledged_at: new Date().toISOString(),
      })
      .select("id")
      .single(),
    "Create disposable case",
  );
  ids.caseId = testCase.id;
  ids.sessionId = `cs_test_build15_${randomUUID().replaceAll("-", "")}`;
  ids.eventIds = Array.from(
    { length: 2 },
    () => `evt_build15_${randomUUID().replaceAll("-", "")}`,
  );
  const session = {
    id: ids.sessionId,
    object: "checkout.session",
    mode: "payment",
    payment_status: "paid",
    customer: null,
    payment_intent: null,
    amount_total: 999,
    currency: "usd",
    metadata: {
      user_id: userId,
      case_id: ids.caseId,
      product_code: "one_time_report",
    },
  };

  const first = await Promise.all(
    Array.from({ length: 8 }, () => deliver(ids.eventIds[0], session)),
  );
  const oneProcessed =
    first.filter((status) => status === "processed").length === 1;
  const sevenDuplicates =
    first.filter((status) => status === "duplicate").length === 7;
  const replay = await deliver(ids.eventIds[0], session);
  console.log(
    `Same-event replay: ${oneProcessed && sevenDuplicates && replay === "duplicate" ? "PASS" : "FAIL"}; processed=${first.filter((status) => status === "processed").length}, duplicates=${first.filter((status) => status === "duplicate").length}, replay=${replay}`,
  );
  if (!oneProcessed || !sevenDuplicates || replay !== "duplicate") {
    throw new Error("Concurrent delivery did not deduplicate the event.");
  }

  const payment = unwrap(
    await db
      .from("payments")
      .select("id")
      .eq("provider_checkout_session_id", ids.sessionId)
      .single(),
    "Find test payment",
  );
  ids.paymentId = payment.id;
  const original = unwrap(
    await db
      .from("entitlements")
      .select("id")
      .eq("source_type", "payment")
      .eq("source_id", payment.id)
      .single(),
    "Find test entitlement",
  );
  unwrap(
    await db
      .from("entitlements")
      .update({ usage_count: 1 })
      .eq("id", original.id),
    "Set test usage",
  );
  const second = await deliver(ids.eventIds[1], session);
  const entitlements = unwrap(
    await db
      .from("entitlements")
      .select("id,usage_count,status")
      .eq("source_type", "payment")
      .eq("source_id", payment.id),
    "Read test entitlements",
  );
  const preserved =
    second === "processed" &&
    entitlements.length === 1 &&
    entitlements[0].usage_count === 1 &&
    entitlements[0].status === "active";
  console.log(
    `Distinct-event replay: ${preserved ? "PASS" : "FAIL"}; entitlements=${entitlements.length}, usage=${entitlements[0]?.usage_count}, second=${second}`,
  );
  if (!preserved)
    throw new Error("A distinct event reset the consumed allowance.");
} catch (error) {
  failure = error;
  console.error(`TEST FAILED: ${error.message}`);
} finally {
  try {
    if (!ids.paymentId && ids.sessionId) {
      const payment = unwrap(
        await db
          .from("payments")
          .select("id")
          .eq("provider_checkout_session_id", ids.sessionId)
          .maybeSingle(),
        "Find test payment for cleanup",
      );
      ids.paymentId = payment?.id ?? null;
    }
    if (ids.eventIds.length)
      unwrap(
        await db
          .from("stripe_webhook_events")
          .delete()
          .in("provider_event_id", ids.eventIds),
        "Delete test event receipts",
      );
    if (ids.paymentId)
      unwrap(
        await db
          .from("entitlements")
          .delete()
          .eq("source_type", "payment")
          .eq("source_id", ids.paymentId),
        "Delete test entitlement",
      );
    if (ids.sessionId)
      unwrap(
        await db
          .from("payments")
          .delete()
          .eq("provider_checkout_session_id", ids.sessionId),
        "Delete test payment",
      );
    if (ids.caseId)
      unwrap(
        await db.from("cases").delete().eq("id", ids.caseId),
        "Delete test case",
      );
    console.log(
      "Disposable webhook receipts, entitlement, payment, and case removed.",
    );
  } catch (error) {
    console.error(`CLEANUP FAILED: ${error.message}`);
    console.error(`Test case ID for manual cleanup: ${ids.caseId}`);
    failure ||= error;
  }
}
if (failure) process.exitCode = 1;
