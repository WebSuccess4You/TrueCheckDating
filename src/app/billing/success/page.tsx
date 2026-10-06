import type { Metadata } from "next";
import Link from "next/link";

import { PrivateShell } from "@/components/private/private-shell";
import { requireUser } from "@/lib/auth/user";
import { getEntitlementSummary } from "@/lib/payments/queries";

import styles from "../../private-pages.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Payment Processing" };

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ caseId?: string; session_id?: string }>;
}) {
  const user = await requireUser();
  const query = await searchParams;
  const entitlement = await getEntitlementSummary(user.id, query.caseId);

  return (
    <PrivateShell email={user.email}>
      <section className={styles.headerBlock}>
        <p className={styles.eyebrow}>Stripe checkout return</p>
        <h1>
          {entitlement?.hasFullReportAccess
            ? "Payment confirmed and access granted."
            : "Payment is being verified."}
        </h1>
        <p className={styles.lead}>
          TrueCheckDating.com grants access only after a signed Stripe webhook
          is verified on the server. This return page cannot grant access by
          itself.
        </p>
      </section>
      <article className={styles.card}>
        {entitlement?.hasFullReportAccess ? (
          <>
            <h2>Entitlement active</h2>
            <p>
              {query.caseId
                ? "Your secure report access is now recorded."
                : "Your membership access is now recorded."}
            </p>
          </>
        ) : (
          <>
            <h2>Webhook confirmation pending</h2>
            <p>
              Stripe may take a few seconds to deliver confirmation. Refresh
              this page shortly or return to the case result.
            </p>
          </>
        )}
        <p>
          {query.caseId ? (
            <Link href={`/cases/${query.caseId}/results`}>
              Return to case results
            </Link>
          ) : (
            <Link href="/account">Return to account settings</Link>
          )}
        </p>
      </article>
    </PrivateShell>
  );
}
