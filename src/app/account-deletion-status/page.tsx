import type { Metadata } from "next";
import Link from "next/link";

import { PublicPageShell } from "@/components/public-page-shell";
import { getAccountDeletionReceipt } from "@/lib/account-deletion/queries";

import styles from "../public-pages.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account Deletion Status" };

function readableDate(value: string | null): string {
  if (!value) return "Not yet available";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function AccountDeletionStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const receipt = token ? await getAccountDeletionReceipt(token) : null;

  return (
    <PublicPageShell>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Account deletion</p>
          <h1>
            {receipt
              ? "Deletion request status."
              : "Status receipt unavailable."}
          </h1>
          <p className={styles.lead}>
            {receipt
              ? "This receipt contains no email address, case text, private notes, or payment details."
              : "The private status token is missing, invalid, or no longer recognized."}
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.bodyCopy}>
          {receipt ? (
            <>
              <h2>Status: {receipt.status}</h2>
              <p>Requested: {readableDate(receipt.requestedAt)}</p>
              <p>Completed: {readableDate(receipt.completedAt)}</p>
              <p>
                Memberships canceled during deletion:{" "}
                {receipt.membershipCancellationCount}
              </p>
              {receipt.status === "completed" ? (
                <p>
                  The authentication account and user-owned TrueCheckDating.com
                  application records were removed. This status receipt and
                  sanitized operational audit records do not contain private
                  case material.
                </p>
              ) : null}
              {receipt.status === "failed" ? (
                <p>
                  The deletion did not finish safely. Contact support and keep
                  this private receipt URL. Do not publish the URL.
                </p>
              ) : null}
            </>
          ) : (
            <p>
              Return to the exact private receipt URL shown after an account
              deletion request, or contact support.
            </p>
          )}
          <p>
            <Link href="/">Return to TrueCheckDating.com</Link>
          </p>
        </div>
      </section>
    </PublicPageShell>
  );
}
