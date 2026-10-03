import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildOperationalAlert,
  createOperationalAlertSender,
} from "./alerts.mjs";
const event = {
  category: "ai_analysis_failed" as const,
  requestId: "12345678-1234-4234-8234-123456789abc",
};
function configure() {
  vi.stubEnv("RESEND_API_KEY", "re_synthetic_test_key");
  vi.stubEnv("OPERATIONS_ALERT_FROM", "onboarding@resend.dev");
  vi.stubEnv("OPERATIONS_ALERT_TO", "operator@example.com");
}
afterEach(() => vi.unstubAllEnvs());
describe("sanitized operational alerts", () => {
  it("ignores extra private fields", () => {
    const supplied = {
      ...event,
      transcript: "PRIVATE TRANSCRIPT",
      email: "customer@example.com",
      error: "secret provider body",
    };
    const message = JSON.stringify(buildOperationalAlert(supplied));
    expect(message).toContain(event.requestId);
    for (const value of [supplied.transcript, supplied.email, supplied.error])
      expect(message).not.toContain(value);
  });
  it("rejects untrusted metadata before transport", async () => {
    configure();
    const transport = vi.fn<typeof fetch>();
    expect(
      await createOperationalAlertSender(transport)({
        ...event,
        requestId: "private text",
      }),
    ).toEqual({ status: "failed" });
    expect(transport).not.toHaveBeenCalled();
    expect(() =>
      buildOperationalAlert({
        ...event,
        category: "private text" as typeof event.category,
      }),
    ).toThrow();
  });
  it("suppresses concurrent alerts and expires cooldown", async () => {
    configure();
    let time = 0;
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 200 }));
    const send = createOperationalAlertSender(transport, () => time);
    const results = await Promise.all([send(event), send(event), send(event)]);
    expect(results.map((r) => r.status).sort()).toEqual([
      "accepted",
      "suppressed",
      "suppressed",
    ]);
    expect(transport).toHaveBeenCalledTimes(1);
    time = 15 * 60 * 1000;
    expect(
      (
        await send({
          ...event,
          requestId: "22345678-1234-4234-8234-123456789abc",
        })
      ).status,
    ).toBe("accepted");
    expect(transport).toHaveBeenCalledTimes(2);
    const options = transport.mock.calls[0][1]!;
    expect(options.redirect).toBe("error");
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(options.body as string).to).toEqual([
      "operator@example.com",
    ]);
  });
  it("returns safe failure for HTTP and network errors", async () => {
    configure();
    const rejected = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("SECRET", { status: 403 }));
    expect(await createOperationalAlertSender(rejected)(event)).toEqual({
      status: "failed",
    });
    const thrown = vi.fn<typeof fetch>().mockRejectedValue(new Error("SECRET"));
    expect(await createOperationalAlertSender(thrown)(event)).toEqual({
      status: "failed",
    });
  });
  it("makes no request when disabled or partially configured", async () => {
    for (const name of [
      "RESEND_API_KEY",
      "OPERATIONS_ALERT_FROM",
      "OPERATIONS_ALERT_TO",
    ])
      vi.stubEnv(name, "");
    const transport = vi.fn<typeof fetch>();
    const send = createOperationalAlertSender(transport);
    expect((await send(event)).status).toBe("disabled");
    vi.stubEnv("RESEND_API_KEY", "re_synthetic");
    expect((await send(event)).status).toBe("failed");
    expect(transport).not.toHaveBeenCalled();
  });
});
