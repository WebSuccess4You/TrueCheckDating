import type { Metadata } from "next";
import Link from "next/link";

import { PrivateShell } from "@/components/private/private-shell";
import { requireUser } from "@/lib/auth/user";

import styles from "../../private-pages.module.css";

export const metadata: Metadata = { title: "Your Data and Privacy" };

export default async function AccountPrivacyPage() {
  const user = await requireUser();

  return (
    <PrivateShell email={user.email}>
      <section className={styles.headerBlock}>
        <p className={styles.eyebrow}>Your data and privacy</p>
        <h1>Understand what the account stores.</h1>
        <p className={styles.lead}>
          TrueCheckDating.com uses private case data to provide the checks and
          reports you request. It does not create a public accusation directory
          or sell submitted conversations and photographs.
        </p>
      </section>

      <div className={styles.grid}>
        <article className={styles.card}>
          <h2>Account and consent</h2>
          <p>
            The service stores your account identifier, email through the
            authentication provider, adult confirmation, and versions of the
            Terms and Privacy notices you accepted.
          </p>
        </article>
        <article className={styles.card}>
          <h2>Private case material</h2>
          <p>
            Cases may contain encrypted conversation text, encrypted private
            notes, structured check answers, AI observations, scores, and report
            snapshots. Raw transcripts and private notes are excluded from the
            printable final report.
          </p>
        </article>
        <article className={styles.card}>
          <h2>Service providers</h2>
          <p>
            Supabase supports authentication and database storage, OpenAI
            processes requested chat analyses, and Stripe handles payment-card
            information. TrueCheckDating.com does not store raw payment-card
            numbers.
          </p>
        </article>
        <article className={styles.card}>
          <h2>Deletion</h2>
          <p>
            Individual cases can be deleted from their case pages. Account
            deletion requires the current password, cancels active membership,
            revokes access, removes the authentication user, and purges
            user-owned application records through database cascades.
          </p>
        </article>
        <article className={styles.card}>
          <h2>Operational records</h2>
          <p>
            A deletion receipt and sanitized audit event can remain without the
            account email or private case content. Stripe and infrastructure
            providers may retain limited billing, fraud-prevention, backup, or
            legal records under their own obligations and retention cycles.
          </p>
        </article>
        <article className={styles.card}>
          <h2>Legal review</h2>
          <p>
            These are product controls, not the final legal Privacy Policy. The
            public policy, retention promises, and Terms require qualified legal
            review before launch.
          </p>
          <p>
            <Link href="/privacy">Read the public privacy summary</Link>
          </p>
        </article>
      </div>
    </PrivateShell>
  );
}
