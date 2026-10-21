import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  getStripeClient: vi.fn(),
  getStripeEnvironment: vi.fn(),
  from: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

vi.mock("@/lib/server-env", () => ({
  getStripeEnvironment: mocks.getStripeEnvironment,
}));

vi.mock("./stripe", () => ({
  getStripeClient: mocks.getStripeClient,
}));

import { processStripeEvent } from "./webhook";

function mockQuery(result: { data?: unknown; error?: unknown } = {}) {
  const query: Record<string, unknown> = {};
  for (const method of [
    "select",
    "eq",
    "single",
    "maybeSingle",
    "upsert",
    "insert",
    "update",
  ]) {
    query[method] = vi.fn().mockReturnValue(query);
  }
  query.then = (resolve: (value: unknown) => void) =>
    Promise.resolve({ data: null, error: null, ...result }).then(resolve);
  return query;
}

describe("Build 17 Stripe webhook integration", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.rpc.mockResolvedValue({ data: "new", error: null });
    mocks.createAdminClient.mockReturnValue({
      from: mocks.from,
      rpc: mocks.rpc,
    });
  });

  it("skips an already completed Stripe event", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: "completed",
      error: null,
    });

    mocks.createAdminClient.mockReturnValue({
      rpc,
      from: vi.fn(),
    });

    const event = {
      id: "evt_duplicate_test",
      type: "checkout.session.completed",
      created: 1790812800,
      data: { object: {} },
    };

    await expect(processStripeEvent(event as never)).resolves.toBe("duplicate");

    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith(
      "reserve_stripe_webhook_event",
      expect.objectContaining({
        p_event_id: "evt_duplicate_test",
        p_event_type: "checkout.session.completed",
        p_claim_token: expect.any(String),
      }),
    );
    expect(
      mocks.createAdminClient.mock.results[0].value.from,
    ).not.toHaveBeenCalled();
  });
  it("skips an event already being processed", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: "processing", error: null });
    const from = vi.fn();
    mocks.createAdminClient.mockReturnValue({ rpc, from });
    const event = {
      id: "evt_processing_test",
      type: "checkout.session.completed",
      created: 1790812800,
      data: { object: {} },
    };
    await expect(processStripeEvent(event as never)).resolves.toBe("duplicate");
    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith(
      "reserve_stripe_webhook_event",
      expect.objectContaining({
        p_event_id: "evt_processing_test",
        p_event_type: "checkout.session.completed",
        p_claim_token: expect.any(String),
      }),
    );
    expect(from).not.toHaveBeenCalled();
  });

  it("rejects failed webhook reservations", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "reservation failed" },
    });
    const from = vi.fn();
    mocks.createAdminClient.mockReturnValue({ rpc, from });
    const event = {
      id: "evt_reservation_failed",
      type: "checkout.session.completed",
      created: 1790812800,
      data: { object: {} },
    };
    await expect(processStripeEvent(event as never)).rejects.toThrow(
      "Could not reserve Stripe event processing.",
    );
    expect(rpc).toHaveBeenCalledOnce();
    expect(from).not.toHaveBeenCalled();
  });

  it("grants four report generations after a paid checkout", async () => {
    const tables = new Map<string, ReturnType<typeof mockQuery>>();
    mocks.from.mockImplementation(
      (table: string) => tables.get(table) ?? mockQuery(),
    );
    tables.set(
      "products",
      mockQuery({ data: { id: "prod_report_test" }, error: null }),
    );
    tables.set("cases", mockQuery({ data: { id: "case_test" }, error: null }));
    tables.set(
      "payments",
      mockQuery({ data: { id: "payment_report_test" }, error: null }),
    );
    tables.set("entitlements", mockQuery({ data: null, error: null }));
    tables.set(
      "stripe_webhook_events",
      mockQuery({
        data: { provider_event_id: "evt_report_paid" },
        error: null,
      }),
    );
    const event = {
      id: "evt_report_paid",
      type: "checkout.session.completed",
      created: 1790812800,
      data: {
        object: {
          id: "cs_report_paid",
          mode: "payment",
          payment_status: "paid",
          amount_total: 999,
          currency: "usd",
          customer: "cus_report_test",
          payment_intent: "pi_report_test",
          metadata: {
            user_id: "user_test",
            case_id: "case_test",
            product_code: "one_time_report",
          },
        },
      },
    };
    expect(event.data.object.amount_total).toBe(999);
    expect(event.data.object.metadata.product_code).toBe("one_time_report");
    await expect(processStripeEvent(event as never)).resolves.toBe("processed");
    const caseQuery = tables.get("cases");
    expect(caseQuery?.eq).toHaveBeenCalledWith("id", "case_test");
    expect(caseQuery?.eq).toHaveBeenCalledWith("auth_user_id", "user_test");
    const paymentQuery = tables.get("payments");
    expect(paymentQuery?.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user_test",
        case_id: "case_test",
        provider_checkout_session_id: "cs_report_paid",
        provider_payment_id: "pi_report_test",
        amount_minor_units: 999,
        status: "paid",
      }),
      expect.objectContaining({ onConflict: "provider_checkout_session_id" }),
    );
    const entitlement = tables.get("entitlements");
    expect(entitlement?.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user_test",
        case_id: "case_test",
        source_id: "payment_report_test",
        usage_limit: 4,
        usage_count: 0,
        status: "active",
      }),
    );
    const payload = (entitlement?.insert as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    const durationMs =
      Date.parse(payload.ends_at) - Date.parse(payload.starts_at);
    expect(durationMs).toBeLessThanOrEqual(30 * 24 * 60 * 60 * 1000 + 1000);
    expect(
      Date.parse(payload.ends_at) - Date.parse(payload.starts_at),
    ).toBeGreaterThanOrEqual(30 * 24 * 60 * 60 * 1000);
  });

  it("preserves existing report usage on payment replay", async () => {
    const tables = new Map<string, ReturnType<typeof mockQuery>>();
    mocks.from.mockImplementation(
      (table: string) => tables.get(table) ?? mockQuery(),
    );
    tables.set(
      "products",
      mockQuery({ data: { id: "prod_report_test" }, error: null }),
    );
    tables.set("cases", mockQuery({ data: { id: "case_test" }, error: null }));
    tables.set(
      "payments",
      mockQuery({ data: { id: "payment_report_test" }, error: null }),
    );
    tables.set(
      "entitlements",
      mockQuery({
        data: { id: "entitlement_existing", usage_count: 2 },
        error: null,
      }),
    );
    tables.set(
      "stripe_webhook_events",
      mockQuery({
        data: { provider_event_id: "evt_report_replay" },
        error: null,
      }),
    );
    const event = {
      id: "evt_report_replay",
      type: "checkout.session.completed",
      created: 1790812800,
      data: {
        object: {
          id: "cs_report_paid",
          mode: "payment",
          payment_status: "paid",
          amount_total: 999,
          currency: "usd",
          customer: "cus_report_test",
          payment_intent: "pi_report_test",
          metadata: {
            user_id: "user_test",
            case_id: "case_test",
            product_code: "one_time_report",
          },
        },
      },
    };
    expect(event.data.object.amount_total).toBe(999);
    expect(event.data.object.metadata.product_code).toBe("one_time_report");
    await expect(processStripeEvent(event as never)).resolves.toBe("processed");
    const caseQuery = tables.get("cases");
    expect(caseQuery?.eq).toHaveBeenCalledWith("id", "case_test");
    expect(caseQuery?.eq).toHaveBeenCalledWith("auth_user_id", "user_test");
    const paymentQuery = tables.get("payments");
    expect(paymentQuery?.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user_test",
        case_id: "case_test",
        provider_checkout_session_id: "cs_report_paid",
        provider_payment_id: "pi_report_test",
        amount_minor_units: 999,
        status: "paid",
      }),
      expect.objectContaining({ onConflict: "provider_checkout_session_id" }),
    );
    const entitlement = tables.get("entitlements");
    expect(entitlement?.insert).not.toHaveBeenCalled();
    expect(entitlement?.update).not.toHaveBeenCalled();
    expect(entitlement?.eq).toHaveBeenCalledWith(
      "source_id",
      "payment_report_test",
    );
  });

  it("revokes report access after a refund", async () => {
    const payment = mockQuery({
      data: { id: "payment_report_test" },
      error: null,
    });
    const entitlement = mockQuery({ data: null, error: null });
    const completed = mockQuery({
      data: { provider_event_id: "evt_refund_test" },
      error: null,
    });
    mocks.from.mockImplementation(
      (table: string) =>
        ({
          payments: payment,
          entitlements: entitlement,
          stripe_webhook_events: completed,
        })[table] ?? mockQuery(),
    );
    const event = {
      id: "evt_refund_test",
      type: "charge.refunded",
      created: 1790812800,
      data: {
        object: {
          id: "ch_refund_test",
          refunded: true,
          payment_intent: "pi_report_test",
        },
      },
    };
    await expect(processStripeEvent(event as never)).resolves.toBe("processed");
    expect(payment.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "refunded" }),
    );
    expect(payment.eq).toHaveBeenCalledWith(
      "provider_payment_id",
      "pi_report_test",
    );
    expect(entitlement.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "revoked" }),
    );
    expect(entitlement.eq).toHaveBeenCalledWith(
      "source_id",
      "payment_report_test",
    );
  });

  it("initializes a paid membership billing period", async () => {
    const subscriptionId = "sub_membership_test";
    const priceId = "price_membership_test";
    mocks.getStripeEnvironment.mockReturnValue({
      monthlyMembershipPriceId: priceId,
    });
    mocks.getStripeClient.mockReturnValue({
      subscriptions: {
        retrieve: vi.fn().mockResolvedValue({
          id: subscriptionId,
          customer: "cus_membership_test",
          status: "active",
          metadata: {
            user_id: "user_test",
            product_code: "monthly_membership",
          },
          cancel_at_period_end: false,
          cancel_at: null,
          items: {
            data: [
              {
                current_period_start: 1790812800,
                current_period_end: 1793491200,
              },
            ],
          },
        }),
      },
    });
    expect(subscriptionId).toBe("sub_membership_test");
    expect(priceId).toBe("price_membership_test");

    const products = mockQuery({
      data: { id: "prod_membership_test" },
      error: null,
    });
    const profiles = mockQuery({ data: { id: "profile_test" }, error: null });
    const events = mockQuery({
      data: { provider_event_id: "evt_membership_paid" },
      error: null,
    });
    mocks.from.mockImplementation(
      (table: string) =>
        ({ products, user_profiles: profiles, stripe_webhook_events: events })[
          table
        ] ?? mockQuery(),
    );
    mocks.rpc.mockImplementation((name: string) =>
      Promise.resolve({
        data:
          name === "initialize_membership_usage_period"
            ? "usage_period_test"
            : name === "synchronize_membership_subscription"
              ? "subscription_record_test"
              : "new",
        error: null,
      }),
    );
    const event = {
      id: "evt_membership_paid",
      type: "invoice.paid",
      created: 1790812800,
      data: {
        object: {
          status: "paid",
          customer: "cus_membership_test",
          parent: { subscription_details: { subscription: subscriptionId } },
          lines: {
            has_more: false,
            data: [
              {
                parent: {
                  type: "subscription_item_details",
                  subscription_item_details: {
                    subscription: subscriptionId,
                    proration: false,
                  },
                },
                pricing: { price_details: { price: priceId } },
                period: { start: 1790812800, end: 1793491200 },
              },
            ],
          },
        },
      },
    };
    await expect(processStripeEvent(event as never)).resolves.toBe("processed");
    const rpcNames = mocks.rpc.mock.calls.map((call) => call[0]);
    expect(
      rpcNames.indexOf("synchronize_membership_subscription"),
    ).toBeLessThan(rpcNames.indexOf("initialize_membership_usage_period"));
    expect(mocks.rpc).toHaveBeenCalledWith(
      "synchronize_membership_subscription",
      expect.objectContaining({
        p_user_id: "user_test",
        p_provider_subscription_id: subscriptionId,
        p_provider_customer_id: "cus_membership_test",
      }),
    );
    expect(mocks.rpc).toHaveBeenCalledWith(
      "initialize_membership_usage_period",
      {
        p_subscription_id: "subscription_record_test",
        p_user_id: "user_test",
        p_period_start: "2026-10-01T00:00:00.000Z",
        p_period_end: "2026-11-01T00:00:00.000Z",
      },
    );
  });

  it("rejects an unpaid membership invoice", async () => {
    const subscriptionId = "sub_membership_test";
    const priceId = "price_membership_test";
    mocks.getStripeEnvironment.mockReturnValue({
      monthlyMembershipPriceId: priceId,
    });
    mocks.getStripeClient.mockReturnValue({
      subscriptions: {
        retrieve: vi.fn().mockResolvedValue({
          id: subscriptionId,
          customer: "cus_membership_test",
          status: "active",
          metadata: {
            user_id: "user_test",
            product_code: "monthly_membership",
          },
          cancel_at_period_end: false,
          cancel_at: null,
          items: {
            data: [
              {
                current_period_start: 1790812800,
                current_period_end: 1793491200,
              },
            ],
          },
        }),
      },
    });
    expect(subscriptionId).toBe("sub_membership_test");
    expect(priceId).toBe("price_membership_test");

    const products = mockQuery({
      data: { id: "prod_membership_test" },
      error: null,
    });
    const profiles = mockQuery({ data: { id: "profile_test" }, error: null });
    const events = mockQuery({
      data: { provider_event_id: "evt_membership_paid" },
      error: null,
    });
    mocks.from.mockImplementation(
      (table: string) =>
        ({ products, user_profiles: profiles, stripe_webhook_events: events })[
          table
        ] ?? mockQuery(),
    );
    mocks.rpc.mockImplementation((name: string) =>
      Promise.resolve({
        data:
          name === "initialize_membership_usage_period"
            ? "usage_period_test"
            : name === "synchronize_membership_subscription"
              ? "subscription_record_test"
              : "new",
        error: null,
      }),
    );
    const event = {
      id: "evt_membership_paid",
      type: "invoice.paid",
      created: 1790812800,
      data: {
        object: {
          status: "open",
          customer: "cus_membership_test",
          parent: { subscription_details: { subscription: subscriptionId } },
          lines: {
            has_more: false,
            data: [
              {
                parent: {
                  type: "subscription_item_details",
                  subscription_item_details: {
                    subscription: subscriptionId,
                    proration: false,
                  },
                },
                pricing: { price_details: { price: priceId } },
                period: { start: 1790812800, end: 1793491200 },
              },
            ],
          },
        },
      },
    };
    await expect(processStripeEvent(event as never)).rejects.toThrow(
      "Paid membership invoice could not be verified.",
    );
    expect(mocks.rpc).not.toHaveBeenCalledWith(
      "initialize_membership_usage_period",
      expect.anything(),
    );
  });

  it("records failed webhook processing", async () => {
    const events = mockQuery({ data: null, error: null });
    mocks.from.mockReturnValue(events);
    const event = {
      id: "evt_failed_processing",
      type: "checkout.session.completed",
      created: 1790812800,
      data: { object: { metadata: {} } },
    };
    await expect(processStripeEvent(event as never)).rejects.toThrow(
      "Checkout session is missing trusted fulfillment metadata.",
    );
    expect(events.update).toHaveBeenCalledWith(
      expect.objectContaining({ processing_status: "failed" }),
    );
    expect(events.eq).toHaveBeenCalledWith(
      "provider_event_id",
      "evt_failed_processing",
    );
    expect(events.eq).toHaveBeenCalledWith("processing_status", "processing");
    expect(events.eq).toHaveBeenCalledWith("claim_token", expect.any(String));
    expect(events.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ processing_status: "completed" }),
    );
  });

  it.each(["paid", "refunded"])(
    "preserves an existing %s payment after delayed failure",
    async (status) => {
      const products = mockQuery({
        data: { id: "prod_report_test" },
        error: null,
      });
      const payments = mockQuery({ data: { status }, error: null });
      const events = mockQuery({
        data: { provider_event_id: "evt_late_failure" },
        error: null,
      });

      mocks.from.mockImplementation(
        (table: string) =>
          ({ products, payments, stripe_webhook_events: events })[table] ??
          mockQuery(),
      );

      const event = {
        id: "evt_late_failure",
        type: "checkout.session.async_payment_failed",
        created: 1790812800,
        data: {
          object: {
            id: "cs_report_paid",
            metadata: {
              user_id: "user_test",
              case_id: "case_test",
              product_code: "one_time_report",
            },
            payment_intent: "pi_report_test",
            amount_total: 999,
            currency: "usd",
          },
        },
      };

      await expect(processStripeEvent(event as never)).resolves.toBe(
        "processed",
      );
      expect(payments.eq).toHaveBeenCalledWith(
        "provider_checkout_session_id",
        "cs_report_paid",
      );
      expect(payments.upsert).not.toHaveBeenCalled();
      expect(events.update).toHaveBeenCalledWith(
        expect.objectContaining({ processing_status: "completed" }),
      );
    },
  );
  it("exports the real webhook processor", () => {
    expect(typeof processStripeEvent).toBe("function");
  });
});
