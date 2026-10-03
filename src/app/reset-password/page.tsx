import type { Metadata } from "next";

import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { PublicPageShell } from "@/components/public-page-shell";
import { requireUser } from "@/lib/auth/user";

import styles from "../auth-pages.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Choose a New Password" };

export default async function ResetPasswordPage() {
  await requireUser();

  return (
    <PublicPageShell>
      <section className={styles.section}>
        <div className={styles.card}>
          <p className={styles.eyebrow}>Secure recovery session</p>
          <h1>Choose a new password.</h1>
          <p className={styles.intro}>
            The reset link established a temporary authenticated session. Use a
            password that you do not reuse on another website.
          </p>
          <UpdatePasswordForm />
        </div>
      </section>
    </PublicPageShell>
  );
}
