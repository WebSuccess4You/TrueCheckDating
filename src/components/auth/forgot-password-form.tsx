"use client";

import Link from "next/link";
import { useActionState } from "react";

import { requestPasswordResetAction } from "@/app/auth-actions";
import { initialAuthActionState } from "@/lib/auth/types";

import styles from "./auth-form.module.css";
import { AuthStatus, FieldError } from "./form-parts";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    requestPasswordResetAction,
    initialAuthActionState,
  );

  return (
    <form action={action} className={styles.form} noValidate>
      <AuthStatus state={state} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="reset-email">
          Account email
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.email ? "reset-email-error" : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.email)}
          autoComplete="email"
          className={styles.input}
          id="reset-email"
          name="email"
          required
          type="email"
        />
        <FieldError errors={state.fieldErrors?.email} id="reset-email-error" />
      </div>
      <button className={styles.submit} disabled={pending} type="submit">
        {pending ? "Sending…" : "Send reset link"}
      </button>
      <p className={styles.formLink}>
        <Link href="/login">Return to login</Link>
      </p>
    </form>
  );
}
