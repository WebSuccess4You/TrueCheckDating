import Stripe from "stripe";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { resetStripeClientForTests } from "./stripe";
import { constructStripeEvent } from "./webhook";

const secret = "whsec_test_truecheck_build11_signature_secret";
const payload = JSON.stringify({
  id: "evt_build11",
  object: "event",
  type: "checkout.session.completed",
  data: { object: { id: "cs_test_build11", object: "checkout.session" } },
});

afterEach(() => {
  vi.unstubAllEnvs();
  resetStripeClientForTests();
});

describe("Stripe webhook signature verification", () => {
  it("accepts an authentic test signature", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_truecheck_build11_secret_key");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", secret);
    vi.stubEnv("STRIPE_ONE_TIME_REPORT_PRICE_ID", "price_report_build11");
    vi.stubEnv("STRIPE_MONTHLY_MEMBERSHIP_PRICE_ID", "price_monthly_build11");
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
    });
    expect(constructStripeEvent(payload, signature).id).toBe("evt_build11");
  });

  it("rejects a forged signature", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_truecheck_build11_secret_key");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", secret);
    vi.stubEnv("STRIPE_ONE_TIME_REPORT_PRICE_ID", "price_report_build11");
    vi.stubEnv("STRIPE_MONTHLY_MEMBERSHIP_PRICE_ID", "price_monthly_build11");
    const signature = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret: "whsec_wrong_secret_for_test",
    });
    expect(() => constructStripeEvent(payload, signature)).toThrow();
  });
});
