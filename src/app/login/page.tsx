import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { PublicPageShell } from "@/components/public-page-shell";
import { isSupabaseConfigured } from "@/lib/env";
import { safeNextPath } from "@/lib/auth/redirects";

import styles from "../auth-pages.module.css";

export const metadata: Metadata = { title: "Log In" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; next?: string }>;
}) {
  const params = await searchParams;

  return (
    <PublicPageShell>
      <section className={styles.section}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>Private account access</p>
          <h1>Log in to your private TrueCheckDating.com account.</h1>
          <p className={styles.intro}>
            Your cases and future reports remain tied to your authenticated
            account. TrueCheckDating.com does not create public case pages.
          </p>
          {params.message ? (
            <p className={styles.message} role="status">
              {params.message}
            </p>
          ) : null}
          {!isSupabaseConfigured() ? (
            <div className={styles.setupNotice} role="note">
              Developer setup is still required: connect a Supabase project and
              apply the included database migration. The form is complete but
              cannot authenticate until those environment values are added.
            </div>
          ) : null}
          <LoginForm next={safeNextPath(params.next)} />
        </div>
      </section>
    </PublicPageShell>
  );
}
