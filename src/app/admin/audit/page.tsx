import type { Metadata } from "next";

import { AdminNav } from "@/components/admin/admin-nav";
import { PrivateShell } from "@/components/private/private-shell";
import { requireStaff } from "@/lib/admin/access";
import { listAuditEvents } from "@/lib/admin/queries";

import adminStyles from "../../../components/admin/admin.module.css";
import styles from "../../private-pages.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administrative Audit Trail" };

function dateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function safeMetadata(value: Record<string, unknown>): string {
  const allowed = Object.fromEntries(
    Object.entries(value).filter(([key]) =>
      [
        "previous_status",
        "next_status",
        "reason_code",
        "lookup_type",
        "result",
        "system_error_id",
        "deletion_request_id",
        "membership_cancellation_count",
        "failure_code",
      ].includes(key),
    ),
  );
  return Object.keys(allowed).length ? JSON.stringify(allowed) : "{}";
}

export default async function AuditTrailPage() {
  const staff = await requireStaff(["admin"]);
  const events = await listAuditEvents();

  return (
    <PrivateShell email={staff.email ?? undefined} role={staff.role}>
      <section className={styles.headerBlock}>
        <p className={styles.eyebrow}>Administration</p>
        <h1>Sanitized audit trail.</h1>
        <p className={styles.lead}>
          Review security-sensitive administrative events. Only approved
          metadata keys are rendered; private content is never displayed.
        </p>
        <AdminNav role={staff.role} />
      </section>

      <section className={adminStyles.panel}>
        <h2>Latest events</h2>
        {events.length ? (
          <div className={adminStyles.tableWrap}>
            <table className={adminStyles.table}>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Actor</th>
                  <th>Target</th>
                  <th>Approved metadata</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>{event.eventType}</td>
                    <td className={adminStyles.code}>
                      {event.actorUserId ?? "System"}
                    </td>
                    <td className={adminStyles.code}>
                      {event.targetUserId ?? "None"}
                    </td>
                    <td className={adminStyles.code}>
                      {safeMetadata(event.metadata)}
                    </td>
                    <td>{dateTime(event.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No audit events are recorded.</p>
        )}
      </section>
    </PrivateShell>
  );
}
