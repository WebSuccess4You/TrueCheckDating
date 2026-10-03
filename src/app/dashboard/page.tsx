import type { Metadata } from "next";
import Link from "next/link";

import { CaseCard } from "@/components/cases/case-card";
import { PrivateShell } from "@/components/private/private-shell";
import { requireUser } from "@/lib/auth/user";
import { listOwnedCases } from "@/lib/cases/queries";

import styles from "../case-pages.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const cases = await listOwnedCases(user.id);
  const activeCases = cases.filter((item) => item.status === "active");
  const archivedCases = cases.filter((item) => item.status === "archived");

  return (
    <PrivateShell email={user.email}>
      <div className={styles.headerRow}>
        <section className={styles.headerBlock}>
          <p className={styles.eyebrow}>Private case dashboard</p>
          <h1>Your saved TrueCheckDating.com cases.</h1>
          <p className={styles.lead}>
            Each case is private to your account. Use a nickname instead of a
            full legal name whenever possible.
          </p>
        </section>
        <Link className={styles.primaryLink} href="/cases/new">
          Create new case
        </Link>
      </div>

      {params.message ? (
        <p className={styles.message} role="status">
          {params.message}
        </p>
      ) : null}
      {params.error ? (
        <p className={styles.errorMessage} role="alert">
          {params.error}
        </p>
      ) : null}

      <div className={styles.summaryGrid} aria-label="Case summary">
        <article className={styles.summaryCard}>
          <strong>{activeCases.length}</strong>
          <span>Active cases</span>
        </article>
        <article className={styles.summaryCard}>
          <strong>{archivedCases.length}</strong>
          <span>Archived cases</span>
        </article>
        <article className={styles.summaryCard}>
          <strong>{cases.length}</strong>
          <span>Total private cases</span>
        </article>
      </div>

      <section
        className={styles.section}
        aria-labelledby="active-cases-heading"
      >
        <div className={styles.sectionHeading}>
          <h2 id="active-cases-heading">Active cases</h2>
          <p>{activeCases.length} saved</p>
        </div>
        {activeCases.length ? (
          <div className={styles.caseGrid}>
            {activeCases.map((caseRecord) => (
              <CaseCard caseRecord={caseRecord} key={caseRecord.id} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <h2>No active cases yet</h2>
            <p>
              Create a private case to begin organizing the information you want
              to review.
            </p>
            <Link className={styles.primaryLink} href="/cases/new">
              Create your first case
            </Link>
          </div>
        )}
      </section>

      {archivedCases.length ? (
        <section
          className={styles.section}
          aria-labelledby="archived-cases-heading"
        >
          <div className={styles.sectionHeading}>
            <h2 id="archived-cases-heading">Archived cases</h2>
            <p>{archivedCases.length} saved</p>
          </div>
          <div className={styles.caseGrid}>
            {archivedCases.map((caseRecord) => (
              <CaseCard caseRecord={caseRecord} key={caseRecord.id} />
            ))}
          </div>
        </section>
      ) : null}
    </PrivateShell>
  );
}
