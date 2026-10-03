import type { Metadata } from "next";
import Link from "next/link";

import { AdminNav } from "@/components/admin/admin-nav";
import { PrivateShell } from "@/components/private/private-shell";
import { requireStaff } from "@/lib/admin/access";
import {
  getAdminMetrics,
  listFailedAnalyses,
  listSystemErrors,
} from "@/lib/admin/queries";

import adminStyles from "../../components/admin/admin.module.css";
import styles from "../private-pages.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administration Overview" };

function dateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AdminOverviewPage() {
  const staff = await requireStaff();
  const [metrics, failures, systemErrors] = await Promise.all([
    getAdminMetrics(),
    listFailedAnalyses(5),
    listSystemErrors(5),
  ]);

  const metricCards = [
    ["Registered users", metrics.registeredUsers],
    ["Active users", metrics.activeUsers],
    ["Private cases", metrics.totalCases],
    ["AI analyses", metrics.totalAnalyses],
    ["Failed analyses", metrics.failedAnalyses],
    ["Paid reports", metrics.paidReports],
    ["Active memberships", metrics.activeMemberships],
    ["Generated reports", metrics.generatedReports],
    ["Open system errors", metrics.unresolvedSystemErrors],
  ] as const;

  return (
    <PrivateShell email={staff.email ?? undefined} role={staff.role}>
      <section className={styles.headerBlock}>
        <p className={styles.eyebrow}>Administration</p>
        <h1>Operational overview.</h1>
        <p className={styles.lead}>
          Review aggregate service health without opening private conversations,
          private notes, or report content.
        </p>
        <AdminNav role={staff.role} />
      </section>

      <section
        aria-label="Aggregate service metrics"
        className={adminStyles.metricGrid}
      >
        {metricCards.map(([label, count]) => (
          <article className={adminStyles.metricCard} key={label}>
            <strong>{count}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>

      <section className={adminStyles.notice}>
        <h2>Private-content boundary</h2>
        <p>
          This console intentionally exposes operational metadata only. It does
          not provide transcript, encrypted note, image, or final-report body
          access. Support lookup is limited to account, billing, entitlement,
          and aggregate case-status information.
        </p>
      </section>

      <section className={adminStyles.panel}>
        <h2>Recent failed analyses</h2>
        {failures.length ? (
          <div className={adminStyles.tableWrap}>
            <table className={adminStyles.table}>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Error code</th>
                  <th>Model</th>
                  <th>Request</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {failures.map((failure) => (
                  <tr key={failure.id}>
                    <td>
                      <span className={adminStyles.badge}>
                        {failure.status}
                      </span>
                    </td>
                    <td>{failure.errorCode ?? "Not recorded"}</td>
                    <td>{failure.modelIdentifier}</td>
                    <td className={adminStyles.code}>{failure.requestId}</td>
                    <td>{dateTime(failure.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No failed or rejected analyses are recorded.</p>
        )}
        <p>
          <Link href="/admin/failures">Open failure review</Link>
        </p>
      </section>

      <section className={adminStyles.panel}>
        <h2>Recent system errors</h2>
        {systemErrors.length ? (
          <div className={adminStyles.tableWrap}>
            <table className={adminStyles.table}>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Class</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {systemErrors.map((error) => (
                  <tr key={error.id}>
                    <td>{error.service}</td>
                    <td>{error.errorClass}</td>
                    <td>{error.severity}</td>
                    <td>{error.resolvedAt ? "Resolved" : "Open"}</td>
                    <td>{dateTime(error.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No sanitized system errors are recorded.</p>
        )}
      </section>
    </PrivateShell>
  );
}
