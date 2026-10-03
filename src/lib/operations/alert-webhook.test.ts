import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  construct: vi.fn(),
  process: vi.fn(),
  alert: vi.fn(),
}));
vi.mock("@/lib/payments/webhook", () => ({
  constructStripeEvent: mocks.construct,
  processStripeEvent: mocks.process,
}));
vi.mock("@/lib/operations/alerts.mjs", () => ({
  notifyOperationalAlert: mocks.alert,
}));
import { POST } from "@/app/api/stripe/webhook/route";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.alert.mockResolvedValue({ status: "accepted" });
});
function request(signature = true) {
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    body: "private payment payload",
    headers: signature ? { "stripe-signature": "synthetic" } : {},
  });
}
describe("payment failure alert integration", () => {
  it("does not send alerts for unsigned or forged requests", async () => {
    expect((await POST(request(false))).status).toBe(400);
    mocks.construct.mockImplementation(() => {
      throw new Error("private signature detail");
    });
    expect((await POST(request())).status).toBe(400);
    expect(mocks.alert).not.toHaveBeenCalled();
  });
  it("sends only generated metadata when verified processing fails and preserves 500", async () => {
    mocks.construct.mockReturnValue({
      id: "private-event",
      data: "private payment",
    });
    mocks.process.mockRejectedValue(new Error("private provider details"));
    expect((await POST(request())).status).toBe(500);
    expect(mocks.alert).toHaveBeenCalledWith({
      category: "payment_webhook_failed",
      requestId: expect.stringMatching(/^[0-9a-f-]{36}$/),
    });
    expect(Object.keys(mocks.alert.mock.calls[0][0]).sort()).toEqual([
      "category",
      "requestId",
    ]);
  });
  it("does not notify successful processing", async () => {
    mocks.construct.mockReturnValue({ id: "synthetic" });
    mocks.process.mockResolvedValue("processed");
    expect((await POST(request())).status).toBe(200);
    expect(mocks.alert).not.toHaveBeenCalled();
  });
});
