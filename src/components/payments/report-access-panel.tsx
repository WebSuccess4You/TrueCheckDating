import {
  MONTHLY_MEMBERSHIP_PRODUCT_CODE,
  ONE_TIME_REPORT_PRODUCT_CODE,
} from "@/lib/payments/constants";
import type { EntitlementSummary } from "@/lib/payments/types";

import { CheckoutButton } from "./checkout-button";
import styles from "./payments.module.css";

function readableDate(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value),
  );
}

export function ReportAccessPanel({
  caseId,
  entitlement,
}: {
  caseId: string;
  entitlement: EntitlementSummary;
}) {
  if (entitlement.hasFullReportAccess) {
    const endDate = readableDate(
      entitlement.source === "membership"
        ? entitlement.membershipEndsAt
        : entitlement.caseEntitlementEndsAt,
    );
    return (
      <section className={styles.activeAccess} aria-labelledby="access-heading">
        <p className={styles.eyebrow}>Verified server-side entitlement</p>
        <h3 id="access-heading">Full report access is active</h3>
        <p>
          Access comes from your{" "}
          {entitlement.source === "membership"
            ? "monthly membership"
            : "individual report purchase"}
          .{endDate ? ` Current access period ends ${endDate}.` : ""}
        </p>
        <p>
          Open the full report to generate a versioned snapshot and print or
          save it as a PDF.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.accessPanel} aria-labelledby="access-heading">
      <div>
        <p className={styles.eyebrow}>Secure Stripe test checkout</p>
        <h3 id="access-heading">Unlock the complete report</h3>
        <p>
          Checkout happens on Stripe. Returning to this site does not unlock the
          report by itself; a signed Stripe webhook must create the entitlement.
        </p>
      </div>
      <div className={styles.productGrid}>
        <article className={styles.productCard}>
          <span>One case</span>
          <strong>$9.99</strong>
          <h4>Individual full report</h4>
          <p>
            Full access for this case, including up to three eligible updates in
            30 days.
          </p>
          <CheckoutButton
            productCode={ONE_TIME_REPORT_PRODUCT_CODE}
            caseId={caseId}
          >
            Buy this report securely
          </CheckoutButton>
        </article>
        <article className={styles.productCard}>
          <span>Monthly</span>
          <strong>$14.99</strong>
          <h4>TrueCheckDating.com membership</h4>
          <p>
            Up to five active cases and twenty analyses during each billing
            period.
          </p>
          <CheckoutButton
            productCode={MONTHLY_MEMBERSHIP_PRODUCT_CODE}
            caseId={caseId}
            secondary
          >
            Start monthly membership
          </CheckoutButton>
        </article>
      </div>
      <p className={styles.smallPrint}>
        Test pricing is configurable. Stripe handles payment details;
        TrueCheckDating.com does not store raw card numbers.
      </p>
    </section>
  );
}
