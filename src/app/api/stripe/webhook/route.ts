import { randomUUID } from "node:crypto";

import { notifyOperationalAlert } from "@/lib/operations/alerts.mjs";
import { NextResponse } from "next/server";

import {
  constructStripeEvent,
  processStripeEvent,
} from "@/lib/payments/webhook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 },
    );
  }

  const rawBody = await request.text();
  let event;
  try {
    event = constructStripeEvent(rawBody, signature);
  } catch {
    return NextResponse.json(
      { error: "Invalid Stripe signature." },
      { status: 400 },
    );
  }

  try {
    const status = await processStripeEvent(event);
    return NextResponse.json({ received: true, status });
  } catch {
    await notifyOperationalAlert({
      category: "payment_webhook_failed",
      requestId: randomUUID(),
    });
    return NextResponse.json(
      { error: "Stripe event processing failed and may be retried." },
      { status: 500 },
    );
  }
}
