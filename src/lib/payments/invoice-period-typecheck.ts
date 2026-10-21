import type Stripe from "stripe";

import { getPaidMembershipPeriod } from "./invoice-period";

export function verifyStripeInvoiceCompatibility(
  invoice: Stripe.Invoice,
  subscriptionId: string,
  membershipPriceId: string,
) {
  return getPaidMembershipPeriod(invoice, subscriptionId, membershipPriceId);
}
