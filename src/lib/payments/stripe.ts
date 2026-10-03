import "server-only";

import Stripe from "stripe";

import { getStripeEnvironment } from "@/lib/server-env";

let stripeClient: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (stripeClient) return stripeClient;
  const environment = getStripeEnvironment();
  stripeClient = new Stripe(environment.secretKey, {
    appInfo: {
      name: "TrueCheckDating.com",
      version: "0.13.0",
    },
    maxNetworkRetries: 2,
    timeout: 30_000,
  });
  return stripeClient;
}

export function resetStripeClientForTests(): void {
  stripeClient = null;
}
