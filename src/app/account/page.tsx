import type { Metadata } from "next";
import Link from "next/link";

import { DeleteAccountForm } from "@/components/account/delete-account-form";
import { PrivateShell } from "@/components/private/private-shell";
import { BillingPortalButton } from "@/components/payments/billing-portal-button";
import { CheckoutButton } from "@/components/payments/checkout-button";
import { requireUser } from "@/lib/auth/user";
import { isSupabaseConfigured } from "@/lib/env";
import { MONTHLY_MEMBERSHIP_PRODUCT_CODE } from "@/lib/payments/constants";
import { getSubscriptionSummary } from "@/lib/payments/queries";
import { createClient } from "@/lib/supabase/server";

import styles from "../private-pages.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Account Settings" };

type ProfileRecord = {
  account_status: string;
  adult_confirmed_at: string | null;
  privacy_accepted_at: string | null;
  privacy_version: string | null;
  terms_accepted_at: string | null;
  terms_version: string | null;
};

function readableDate(value: string | null | undefined): string {
  if (!value) return "Not recorded";
  return (
    new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(new Date(value)) + " UTC"
  );
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  let profile: ProfileRecord | null = null;
  let consentCount = 0;
  const subscription = await getSubscriptionSummary(user.id);

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const profileResult = await supabase
      .from("user_profiles")
      .select(
        "account_status,adult_confirmed_at,privacy_accepted_at,privacy_version,terms_accepted_at,terms_version",
      )
      .eq("auth_user_id", user.id)
      .maybeSingle();
    profile = profileResult.data as ProfileRecord | null;

    const consentResult = await supabase
      .from("consent_records")
      .select("id", { count: "exact", head: true })
      .eq("auth_user_id", user.id);
    consentCount = consentResult.count ?? 0;
  }

  return (
    <PrivateShell email={user.email}>
      <section className={styles.headerBlock}>
        <p className={styles.eyebrow}>Account and consent record</p>
        <h1>Your account settings.</h1>
        <p className={styles.lead}>
          Review consent, billing, privacy controls, and permanent account
          deletion from one private settings page.
        </p>
      </section>

      {params.message ? (
        <p className={styles.message} role="status">
          {params.message}
        </p>
      ) : null}

      <div className={styles.grid}>
        <article className={styles.card}>
          <h2>Account details</h2>
          <dl className={styles.details}>
            <div>
              <dt>Email</dt>
              <dd>{user.email ?? "Not available"}</dd>
            </div>
            <div>
              <dt>Email confirmed</dt>
              <dd>{readableDate(user.email_confirmed_at)}</dd>
            </div>
            <div>
              <dt>Account status</dt>
              <dd>{profile?.account_status ?? "Active"}</dd>
            </div>
          </dl>
        </article>

        <article className={styles.card}>
          <h2>Billing and membership</h2>
          {subscription ? (
            <>
              <dl className={styles.details}>
                <div>
                  <dt>Membership status</dt>
                  <dd>{subscription.status}</dd>
                </div>
                <div>
                  <dt>Current period ends</dt>
                  <dd>{readableDate(subscription.currentPeriodEnd)}</dd>
                </div>
                <div>
                  <dt>Cancellation scheduled</dt>
                  <dd>{subscription.cancelAtPeriodEnd ? "Yes" : "No"}</dd>
                </div>
              </dl>
              <BillingPortalButton />
            </>
          ) : (
            <>
              <p>There is no monthly membership recorded for this account.</p>
              <CheckoutButton
                productCode={MONTHLY_MEMBERSHIP_PRODUCT_CODE}
                secondary
              >
                Start $14.99 monthly membership
              </CheckoutButton>
            </>
          )}
        </article>

        <article className={styles.card}>
          <h2>Consent record</h2>
          <dl className={styles.details}>
            <div>
              <dt>Adult confirmation</dt>
              <dd>{readableDate(profile?.adult_confirmed_at)}</dd>
            </div>
            <div>
              <dt>Terms version</dt>
              <dd>{profile?.terms_version ?? "Pending migration record"}</dd>
            </div>
            <div>
              <dt>Privacy version</dt>
              <dd>{profile?.privacy_version ?? "Pending migration record"}</dd>
            </div>
            <div>
              <dt>Consent events</dt>
              <dd>{consentCount}</dd>
            </div>
          </dl>
        </article>

        <article className={styles.card}>
          <h2>Your data and privacy</h2>
          <p>
            Review the data categories used by the service, outside providers,
            deletion behavior, and operational records that may remain.
          </p>
          <p>
            <Link href="/account/privacy">Open your privacy information</Link>
          </p>
        </article>

        <article className={styles.card}>
          <h2>Permanent account deletion</h2>
          <p>
            Deletion requires your current password. Active membership is
            canceled first, access is revoked, and user-owned application data
            is removed with the authentication account.
          </p>
          <DeleteAccountForm />
        </article>
      </div>
    </PrivateShell>
  );
}
