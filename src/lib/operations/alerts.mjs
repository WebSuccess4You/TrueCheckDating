// Server-side only. Build messages from fixed categories, never raw exceptions.
const categories = {
  ai_analysis_failed:
    "AI conversation analysis failed. Review sanitized failure metadata.",
  payment_webhook_failed:
    "A verified payment webhook failed processing. Stripe may retry it.",
  synthetic_service_failure:
    "Synthetic service failure for the operational alert test. No real service was called.",
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * @typedef {'ai_analysis_failed' | 'payment_webhook_failed' | 'synthetic_service_failure'} AlertCategory
 * @typedef {{category: AlertCategory, requestId: string}} AlertEvent
 */

/** @param {AlertEvent} event */
export function buildOperationalAlert(event) {
  if (
    !Object.hasOwn(categories, event.category) ||
    !uuid.test(event.requestId)
  ) {
    throw new Error("Invalid operational alert metadata.");
  }
  return {
    subject: `TrueCheckDating.com operational alert: ${event.category}`,
    text: [
      categories[event.category],
      `Time: ${new Date().toISOString()}`,
      `Request ID: ${event.requestId}`,
      "Review Administration > Failures for available sanitized diagnostics.",
      "This email contains no conversation, case name, customer email, payment details, or provider response.",
    ].join("\n"),
  };
}

/**
 * Per-process cooldown bounds repeated notifications. Configure provider quotas
 * and shared monitoring before scaling to multiple server instances.
 * @param {typeof fetch} transport
 * @param {() => number} now
 */
export function createOperationalAlertSender(
  transport = fetch,
  now = Date.now,
) {
  /** @type {Map<string, number>} */
  const lastAttempt = new Map();
  /** @param {AlertEvent} event */
  return async function send(event) {
    try {
      if (typeof window !== "undefined") return { status: "failed" };
      const message = buildOperationalAlert(event);
      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.OPERATIONS_ALERT_FROM;
      const to = process.env.OPERATIONS_ALERT_TO;
      if (!apiKey && !from && !to) return { status: "disabled" };
      const email = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
      if (
        !apiKey?.startsWith("re_") ||
        !email.test(from || "") ||
        !email.test(to || "")
      ) {
        return { status: "failed" };
      }
      const timestamp = now();
      const previous = lastAttempt.get(event.category);
      if (previous !== undefined && timestamp - previous < 15 * 60 * 1000)
        return { status: "suppressed" };
      // Reserve before awaiting so simultaneous requests cannot fan out locally.
      lastAttempt.set(event.category, timestamp);
      const response = await transport("https://api.resend.com/emails", {
        method: "POST",
        redirect: "error",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `operations/${event.requestId}`,
        },
        body: JSON.stringify({ from, to: [to], ...message }),
        signal: AbortSignal.timeout(5000),
      });
      // Never read or log the provider body; acceptance is not inbox delivery.
      return { status: response.ok ? "accepted" : "failed" };
    } catch {
      return { status: "failed" };
    }
  };
}

export const sendOperationalAlert = createOperationalAlertSender();

/** @param {AlertEvent} event */
export async function notifyOperationalAlert(event) {
  const result = await sendOperationalAlert(event);
  if (result.status === "failed")
    console.warn("Operational alert delivery failed.");
}
