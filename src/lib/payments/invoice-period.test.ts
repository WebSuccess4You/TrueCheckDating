import { describe, expect, it } from "vitest";

import { getPaidMembershipPeriod } from "./invoice-period";

const membershipPriceId = "price_membership_test";
const subscriptionId = "sub_membership_test";

function makeInvoice(status: "paid" | "open") {
  return {
    status,
    parent: {
      type: "subscription_details",
      subscription_details: {
        subscription: subscriptionId,
        metadata: {},
      },
    },
    lines: {
      data: [
        {
          parent: {
            type: "subscription_item_details",
            subscription_item_details: {
              subscription: subscriptionId,
              subscription_item: "si_membership_test",
              proration: false,
            },
          },
          pricing: {
            type: "price_details",
            price_details: {
              price: membershipPriceId,
              product: "prod_membership_test",
            },
          },
          period: {
            start: 1790812800,
            end: 1793491200,
          },
        },
      ],
      has_more: false,
    },
  };
}

describe("Build 17 paid membership invoice periods", () => {
  it("accepts a paid invoice with the correct membership price", () => {
    const result = getPaidMembershipPeriod(
      makeInvoice("paid"),
      subscriptionId,
      membershipPriceId,
    );

    expect(result).toEqual({
      start: "2026-10-01T00:00:00.000Z",
      end: "2026-11-01T00:00:00.000Z",
    });
  });

  it("rejects an unpaid invoice", () => {
    const result = getPaidMembershipPeriod(
      makeInvoice("open"),
      subscriptionId,
      membershipPriceId,
    );

    expect(result).toBeNull();
  });
});

describe("Build 17 invalid membership invoices", () => {
  it("rejects an incorrect membership price", () => {
    const result = getPaidMembershipPeriod(
      makeInvoice("paid"),
      subscriptionId,
      "price_wrong",
    );

    expect(result).toBeNull();
  });

  it("rejects prorated subscription charges", () => {
    const invoice = makeInvoice("paid");
    invoice.lines.data[0].parent.subscription_item_details.proration = true;

    expect(
      getPaidMembershipPeriod(invoice, subscriptionId, membershipPriceId),
    ).toBeNull();
  });

  it("rejects incomplete invoice line-item lists", () => {
    const invoice = makeInvoice("paid");
    invoice.lines.has_more = true;

    expect(
      getPaidMembershipPeriod(invoice, subscriptionId, membershipPriceId),
    ).toBeNull();
  });

  it("rejects invoices for another subscription", () => {
    expect(
      getPaidMembershipPeriod(
        makeInvoice("paid"),
        "sub_different",
        membershipPriceId,
      ),
    ).toBeNull();
  });
});

describe("Build 17 billing-period integrity", () => {
  it("rejects a billing period whose end is not after its start", () => {
    const invoice = makeInvoice("paid");
    invoice.lines.data[0].period.end = invoice.lines.data[0].period.start;

    expect(
      getPaidMembershipPeriod(invoice, subscriptionId, membershipPriceId),
    ).toBeNull();
  });

  it("rejects invalid billing-period timestamps", () => {
    const invoice = makeInvoice("paid");
    invoice.lines.data[0].period.start = Number.NaN;

    expect(
      getPaidMembershipPeriod(invoice, subscriptionId, membershipPriceId),
    ).toBeNull();
  });

  it("rejects multiple matching subscription invoice lines", () => {
    const invoice = makeInvoice("paid");
    invoice.lines.data.push({
      ...invoice.lines.data[0],
    });

    expect(
      getPaidMembershipPeriod(invoice, subscriptionId, membershipPriceId),
    ).toBeNull();
  });
});

describe("Build 17 mixed invoice lines", () => {
  it("accepts one valid membership line alongside an unrelated line", () => {
    const invoice = makeInvoice("paid");

    invoice.lines.data.push({
      ...invoice.lines.data[0],
      pricing: {
        type: "price_details",
        price_details: {
          price: "price_unrelated_test",
          product: "prod_membership_test",
        },
      },
    });

    expect(
      getPaidMembershipPeriod(invoice, subscriptionId, membershipPriceId),
    ).toEqual({
      start: "2026-10-01T00:00:00.000Z",
      end: "2026-11-01T00:00:00.000Z",
    });
  });
});
