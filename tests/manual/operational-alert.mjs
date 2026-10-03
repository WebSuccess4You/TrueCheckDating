import { randomUUID } from "node:crypto";
import { sendOperationalAlert } from "../../src/lib/operations/alerts.mjs";

// Synthetic catch path exercises the same sender used by AI/payment failures.
const requestId = randomUUID();
try {
  throw new Error(
    "Synthetic failure: private test payload must never leave this process.",
  );
} catch {
  const result = await sendOperationalAlert({
    category: "synthetic_service_failure",
    requestId,
  });
  if (result.status === "accepted") {
    console.log(
      `Synthetic service failure: alert accepted by email provider; request ID=${requestId}`,
    );
    console.log(
      "Check your inbox and spam folder. Inbox delivery still needs confirmation.",
    );
  } else {
    console.error(
      `Operational alert test: ${result.status}. Check the three server-only email settings and Resend dashboard.`,
    );
    process.exitCode = 1;
  }
}
