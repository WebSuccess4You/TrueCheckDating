import type { Metadata } from "next";

import { PublicPageShell } from "@/components/public-page-shell";

import styles from "../public-pages.module.css";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "Read the current TrueCheckDating.com privacy approach, account controls, and deletion behavior.",
};

export default function PrivacyPage() {
  return (
    <PublicPageShell>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Privacy approach</p>
          <h1>Private concerns should remain private.</h1>
          <p className={styles.lead}>
            This page is a development-stage privacy summary, not the final
            legal Privacy Policy. Qualified legal review is required before
            public launch.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.bodyCopy}>
          <h2>Private cases</h2>
          <p>
            Cases belong to the account owner. They are not intended to appear
            in search engines, public directories, or public accusation lists.
          </p>

          <h2>Minimum necessary information</h2>
          <p>
            TrueCheckDating.com encourages private nicknames and removal of
            phone numbers, addresses, account numbers, passwords, and other
            unnecessary personal information before analysis.
          </p>

          <h2>AI processing</h2>
          <p>
            Submitted conversation text is sent from server code to an AI
            service only when the user requests analysis. The request excludes
            passwords, payment-card details, and authentication tokens.
          </p>

          <h2>Payments</h2>
          <p>
            Stripe handles payment-card collection. TrueCheckDating.com stores
            provider identifiers and entitlement records but does not store raw
            payment-card numbers.
          </p>

          <h2>No sale of submitted material</h2>
          <p>
            TrueCheckDating.com does not sell submitted conversations or
            photographs.
          </p>

          <h2>Deletion</h2>
          <p>
            Users can delete individual cases and permanently delete their
            accounts. Account deletion requires password reauthentication,
            cancels active membership, revokes access, removes the
            authentication user, and purges user-owned application records
            through database cascades.
          </p>

          <h2>Deletion receipts and provider retention</h2>
          <p>
            A status receipt and sanitized audit event may remain without raw
            email or private case content. Payment, fraud-prevention,
            infrastructure backup, or legally required records may remain with
            providers under their own obligations and retention cycles.
          </p>

          <h2>Restricted administration</h2>
          <p>
            Administrative tools focus on aggregate use, billing status, and
            sanitized technical failures. Private conversation text is not
            casually available to support personnel.
          </p>
        </div>
      </section>
    </PublicPageShell>
  );
}
