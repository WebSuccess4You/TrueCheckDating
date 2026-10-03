import type { Metadata } from "next";

import { resolveSystemErrorAction } from "@/app/admin-actions";
import { AdminNav } from "@/components/admin/admin-nav";
import { PrivateShell } from "@/components/private/private-shell";
import { requireStaff } from "@/lib/admin/access";
import { listFailedAnalyses, listSystemErrors } from "@/lib/admin/queries";

import adminStyles from "../../../components/admin/admin.module.css";
import styles from "../../private-pages.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Failure Review" };

function dateTime(value: string | null): string {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function FailureReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const staff = await requireStaff();
  const params = await searchParams;
  const [failures, systemErrors] = await Promise.all([
    listFailedAnalyses(),
    listSystemErrors(),
  ]);

  return (
    <PrivateShell email={staff.email ?? undefined} role={staff.role}>
      <section className={styles.headerBlock}>
        <p className={styles.eyebrow}>Administration</p>
        <h1>Failure review.</h1>
        <p className={styles.lead}>
          Diagnose failures using request IDs, error classes, versions, and
          sanitized messages. Conversation text is deliberately unavailable.
        </p>
        <AdminNav role={staff.role} />
      </section>

      {params.message ? (
        <p className={adminStyles.message}>{params.message}</p>
      ) : null}
      {params.error ? (
        <p className={adminStyles.error} role="alert">
          {params.error}
        </p>
      ) : null}

      <section className={adminStyles.panel}>
        <h2>Failed or rejected AI analyses</h2>
        {failures.length ? (
          <div className={adminStyles.tableWrap}>
            <table className={adminStyles.table}>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Error</th>
                  <th>Model and prompt</th>
                  <th>Request ID</th>
                  <th>Created / completed</th>
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
                    <td>
                      {failure.modelIdentifier}
                      <br />
                      <span className={adminStyles.code}>
                        {failure.promptVersion} / {failure.schemaVersion}
                      </span>
                    </td>
                    <td className={adminStyles.code}>{failure.requestId}</td>
                    <td>
                      {dateTime(failure.createdAt)}
                      <br />
                      {dateTime(failure.completedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No failed or rejected analyses are recorded.</p>
        )}
      </section>

      <section className={adminStyles.panel}>
        <h2>Sanitized system errors</h2>
        {systemErrors.length ? (
          <div className={adminStyles.tableWrap}>
            <table className={adminStyles.table}>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Class and message</th>
                  <th>Severity</th>
                  <th>Request</th>
                  <th>Resolution</th>
                </tr>
              </thead>
              <tbody>
                {systemErrors.map((error) => (
                  <tr key={error.id}>
                    <td>{error.service}</td>
                    <td>
                      <strong>{error.errorClass}</strong>
                      <br />
                      {error.sanitizedMessage}
                    </td>
                    <td>
                      {error.severity}
                      <br />
                      {error.retryable ? "Retryable" : "Not retryable"}
                    </td>
                    <td className={adminStyles.code}>
                      {error.requestId ?? "None"}
                    </td>
                    <td>
                      {error.resolvedAt ? (
                        <>Resolved {dateTime(error.resolvedAt)}</>
                      ) : staff.role === "admin" ? (
                        <form action={resolveSystemErrorAction}>
                          <input
                            name="errorId"
                            type="hidden"
                            value={error.id}
                          />
                          <button
                            className={adminStyles.smallButton}
                            type="submit"
                          >
                            Mark resolved
                          </button>
                        </form>
                      ) : (
                        "Open — administrator action required"
                      )}
                    </td>
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
