import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { PublicPageShell } from "@/components/public-page-shell";
import { isSupabaseConfigured } from "@/lib/env";

import styles from "../auth-pages.module.css";

export const metadata: Metadata = { title: "Reset Password" };

export default function ForgotPasswordPage() {
  return (
    <PublicPageShell>
      <section className={styles.section}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>Account recovery</p>
          <h1>Request a secure password-reset link.</h1>
          <p className={styles.intro}>
            For account privacy, the result will not reveal whether an email
            address is registered.
          </p>
          {!isSupabaseConfigured() ? (
            <div className={styles.setupNotice} role="note">
              Password-reset email delivery becomes active after Supabase is
              connected and redirect URLs are configured.
            </div>
          ) : null}
          <ForgotPasswordForm />
        </div>
      </section>
    </PublicPageShell>
  );
}
