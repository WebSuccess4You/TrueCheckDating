import type { Metadata } from "next";

import { AccountStatusForm } from "@/components/admin/account-status-form";
import { AdminNav } from "@/components/admin/admin-nav";
import { PrivateShell } from "@/components/private/private-shell";
import { requireStaff } from "@/lib/admin/access";
import { lookupSupportAccount, recordAuditEvent } from "@/lib/admin/queries";
import { supportLookupSchema } from "@/lib/admin/validation";

import adminStyles from "../../../components/admin/admin.module.css";
import styles from "../../private-pages.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Support Lookup" };

function dateTime(value: string | null): string {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function SupportLookupPage({
  searchParams,
}: {
  searchParams: Promise<{
    email?: string;
    userId?: string;
    error?: string;
    message?: string;
  }>;
}) {
  const staff = await requireStaff();
  const params = await searchParams;
  const hasLookup = Boolean(params.email || params.userId);
  const parsed = hasLookup
    ? supportLookupSchema.safeParse({
        email: params.email,
        userId: params.userId,
      })
    : null;
  let account = null;
  let lookupError = params.error;

  if (parsed?.success) {
    account = await lookupSupportAccount(parsed.data);
    await recordAuditEvent({
      actorUserId: staff.authUserId,
      targetUserId: account?.authUserId ?? null,
      eventType: "staff_account_lookup",
      metadata: {
        lookup_type: parsed.data.userId ? "internal_user_id" : "exact_email",
        result: account ? "found" : "not_found",
      },
    });
  } else if (parsed && !parsed.success) {
    lookupError = parsed.error.issues[0]?.message;
  }

  return (
    <PrivateShell email={staff.email ?? undefined} role={staff.role}>
      <section className={styles.headerBlock}>
        <p className={styles.eyebrow}>Administration</p>
        <h1>Support lookup.</h1>
        <p className={styles.lead}>
          Find an exact account to review status, billing, entitlement, and
          aggregate usage information. Private case content is not available.
        </p>
        <AdminNav role={staff.role} />
      </section>

      {params.message ? (
        <p className={adminStyles.message}>{params.message}</p>
      ) : null}
      {lookupError ? (
        <p className={adminStyles.error} role="alert">
          {lookupError}
        </p>
      ) : null}

      <section className={adminStyles.panel}>
        <h2>Exact account search</h2>
        <form className={adminStyles.searchForm} method="get">
          <label>
            Account email
            <input
              autoComplete="off"
              defaultValue={params.email ?? ""}
              name="email"
              placeholder="customer@example.com"
              type="email"
            />
          </label>
          <button className={adminStyles.primaryButton} type="submit">
            Search account
          </button>
        </form>
        <p>
          Searches are recorded in the sanitized audit trail. Search terms are
          not copied into audit metadata.
        </p>
      </section>

      {hasLookup && parsed?.success && !account ? (
        <section className={adminStyles.notice}>
          <h2>No account found</h2>
          <p>No exact matching account was found.</p>
        </section>
      ) : null}

      {account ? (
        <>
          <section className={adminStyles.panel}>
            <h2>Account summary</h2>
            <dl className={adminStyles.definitionGrid}>
              <div>
                <dt>Email</dt>
                <dd>{account.email}</dd>
              </div>
              <div>
                <dt>Internal user ID</dt>
                <dd className={adminStyles.code}>{account.authUserId}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{account.role}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{account.accountStatus}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{dateTime(account.createdAt)}</dd>
              </div>
              <div>
                <dt>Updated</dt>
                <dd>{dateTime(account.updatedAt)}</dd>
              </div>
              <div>
                <dt>Cases</dt>
                <dd>{account.counts.cases}</dd>
              </div>
              <div>
                <dt>Completed analyses</dt>
                <dd>{account.counts.completedAnalyses}</dd>
              </div>
              <div>
                <dt>Payments</dt>
                <dd>{account.counts.payments}</dd>
              </div>
              <div>
                <dt>Active entitlements</dt>
                <dd>{account.counts.activeEntitlements}</dd>
              </div>
              <div>
                <dt>Latest payment status</dt>
                <dd>{account.latestPaymentStatus ?? "None"}</dd>
              </div>
              <div>
                <dt>Membership status</dt>
                <dd>{account.latestSubscriptionStatus ?? "None"}</dd>
              </div>
              <div>
                <dt>Membership period end</dt>
                <dd>{dateTime(account.latestSubscriptionPeriodEnd)}</dd>
              </div>
            </dl>
          </section>

          <section className={adminStyles.notice}>
            <h2>Content remains hidden</h2>
            <p>
              This page does not show case nicknames, claimed identities,
              transcripts, AI findings, private notes, image-search links, video
              answers, or report bodies.
            </p>
          </section>

          {staff.role === "admin" &&
          account.role === "user" &&
          ["active", "suspended"].includes(account.accountStatus) ? (
            <section className={adminStyles.panel}>
              <h2>Administrator account control</h2>
              <AccountStatusForm
                currentStatus={account.accountStatus}
                targetUserId={account.authUserId}
              />
            </section>
          ) : null}
        </>
      ) : null}
    </PrivateShell>
  );
}
