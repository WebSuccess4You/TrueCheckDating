"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signupAction } from "@/app/auth-actions";
import { initialAuthActionState } from "@/lib/auth/types";

import styles from "./auth-form.module.css";
import { AuthStatus, FieldError } from "./form-parts";

export function SignupForm() {
  const [state, action, pending] = useActionState(
    signupAction,
    initialAuthActionState,
  );

  return (
    <form action={action} className={styles.form} noValidate>
      <AuthStatus state={state} />

      <div className={styles.field}>
        <label className={styles.label} htmlFor="signup-email">
          Email address
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.email ? "signup-email-error" : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.email)}
          autoComplete="email"
          className={styles.input}
          id="signup-email"
          name="email"
          required
          type="email"
        />
        <FieldError errors={state.fieldErrors?.email} id="signup-email-error" />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="signup-password">
          Password
        </label>
        <input
          aria-describedby="signup-password-help signup-password-error"
          aria-invalid={Boolean(state.fieldErrors?.password)}
          autoComplete="new-password"
          className={styles.input}
          id="signup-password"
          name="password"
          required
          type="password"
        />
        <p className={styles.help} id="signup-password-help">
          Use at least 12 characters with uppercase, lowercase, and a number.
        </p>
        <FieldError
          errors={state.fieldErrors?.password}
          id="signup-password-error"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="signup-confirm-password">
          Confirm password
        </label>
        <input
          aria-describedby={
            state.fieldErrors?.confirmPassword
              ? "signup-confirm-password-error"
              : undefined
          }
          aria-invalid={Boolean(state.fieldErrors?.confirmPassword)}
          autoComplete="new-password"
          className={styles.input}
          id="signup-confirm-password"
          name="confirmPassword"
          required
          type="password"
        />
        <FieldError
          errors={state.fieldErrors?.confirmPassword}
          id="signup-confirm-password-error"
        />
      </div>

      <div className={styles.checkboxGroup}>
        <label className={styles.checkboxLabel}>
          <input name="adultConfirmed" required type="checkbox" />
          <span>I confirm that I am at least 18 years old.</span>
        </label>
        <FieldError
          errors={state.fieldErrors?.adultConfirmed}
          id="adult-confirmed-error"
        />

        <label className={styles.checkboxLabel}>
          <input name="termsAccepted" required type="checkbox" />
          <span>
            I accept the <Link href="/terms">Terms of Service</Link>, including
            the rule against harassment, stalking, or public accusations.
          </span>
        </label>
        <FieldError
          errors={state.fieldErrors?.termsAccepted}
          id="terms-accepted-error"
        />

        <label className={styles.checkboxLabel}>
          <input name="privacyAccepted" required type="checkbox" />
          <span>
            I accept the <Link href="/privacy">Privacy Policy</Link> and
            understand that submitted text may be processed by an AI service.
          </span>
        </label>
        <FieldError
          errors={state.fieldErrors?.privacyAccepted}
          id="privacy-accepted-error"
        />
      </div>

      <button className={styles.submit} disabled={pending} type="submit">
        {pending ? "Creating account…" : "Create private account"}
      </button>

      <p className={styles.formLink}>
        Already registered? <Link href="/login">Log in</Link>
      </p>
    </form>
  );
}
