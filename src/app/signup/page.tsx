import type { Metadata } from "next";

import { SignupForm } from "@/components/auth/signup-form";
import { PublicPageShell } from "@/components/public-page-shell";
import { isSupabaseConfigured } from "@/lib/env";

import styles from "../auth-pages.module.css";

export const metadata: Metadata = { title: "Create a Private Account" };

export default function SignupPage() {
  return (
    <PublicPageShell>
      <section className={styles.section}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>Private accounts</p>
          <h1>Create your private TrueCheckDating.com account.</h1>
          <p className={styles.intro}>
            Start with an email address and a strong password. You can use
            private case nicknames later instead of a person&apos;s real name.
          </p>
          {!isSupabaseConfigured() ? (
            <div className={styles.setupNotice} role="note">
              The secure authentication code is ready, but the application must
              be connected to Supabase before registration can create an
              account.
            </div>
          ) : null}
          <SignupForm />
        </div>
      </section>
    </PublicPageShell>
  );
}
