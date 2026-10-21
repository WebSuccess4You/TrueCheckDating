type StripeIdentifier = string | { id: string };

type InvoiceLine = {
  parent?: {
    type?: string;
    subscription_item_details?: {
      subscription: string | null;
      proration: boolean;
    } | null;
  } | null;
  pricing?: {
    price_details?: {
      price: StripeIdentifier;
    } | null;
  } | null;
  period: {
    start: number;
    end: number;
  };
};

type InvoiceLike = {
  status: string | null;
  parent?: {
    subscription_details?: {
      subscription: StripeIdentifier;
    } | null;
  } | null;
  lines: {
    data: InvoiceLine[];
    has_more: boolean;
  };
};

type BillingPeriod = {
  start: string;
  end: string;
};

function identifier(value: StripeIdentifier): string {
  return typeof value === "string" ? value : value.id;
}

export function getPaidMembershipPeriod(
  invoice: InvoiceLike,
  subscriptionId: string,
  membershipPriceId: string,
): BillingPeriod | null {
  if (invoice.status !== "paid") return null;

  const invoiceSubscription =
    invoice.parent?.subscription_details?.subscription;

  if (
    !invoiceSubscription ||
    identifier(invoiceSubscription) !== subscriptionId
  ) {
    return null;
  }

  // Incomplete line-item lists require a separate Stripe retrieval.
  if (invoice.lines.has_more) return null;

  const matches = invoice.lines.data.filter((line) => {
    const parent = line.parent;
    const details = parent?.subscription_item_details;
    const price = line.pricing?.price_details?.price;

    return (
      parent?.type === "subscription_item_details" &&
      details?.subscription === subscriptionId &&
      details.proration === false &&
      price != null &&
      identifier(price) === membershipPriceId
    );
  });

  // Do not guess when no line or multiple lines qualify.
  if (matches.length !== 1) return null;

  const { start, end } = matches[0].period;

  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start <= 0 ||
    end <= start
  ) {
    return null;
  }

  const startDate = new Date(start * 1000);
  const endDate = new Date(end * 1000);

  if (
    !Number.isFinite(startDate.getTime()) ||
    !Number.isFinite(endDate.getTime())
  ) {
    return null;
  }

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  };
}
