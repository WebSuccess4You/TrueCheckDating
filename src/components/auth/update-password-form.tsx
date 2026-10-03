"use client";

import { useActionState } from "react";

import { updatePasswordAction } from "@/app/auth-actions";
import { initialAuthActionState } from "@/lib/auth/types";

import styles from "./auth-form.module.css";
import { AuthStatus, FieldError } from "./form-parts";

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(
    updatePasswordAction,
    initialAuthActionState,
  );

  return (
    <form action={action} className={styles.form} noValidate>
      <AuthStatus state={state} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="new-password">
          New password
        </label>
        <input
          aria-describedby="new-password-help new-password-error"
          aria-invalid={Boolean(state.fieldErrors?.password)}
          autoComplete="new-password"
          className={styles.input}
          id="new-password"
          name="password"
          required
          type="password"
        />
        <p className={styles.help} id="new-password-help">
          Use at least 12 characters with uppercase, lowercase, and a number.
        </p>
        <FieldError
          errors={state.fieldErrors?.password}
          id="new-password-error"
        />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="confirm-new-password">
          Confirm new password
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.confirmPassword
              ? "confirm-new-password-error"
              : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
          autoComplete="new-password"
          className={styles.input}
          id="confirm-new-password"
          name="confirmPassword"
          required
          type="password"
        />
        <FieldError
          errors={state.fieldErrors?.confirmPassword}
          id="confirm-new-password-error"
        />
      </div>
      <button className={styles.submit} disabled={pending} type="submit">
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
