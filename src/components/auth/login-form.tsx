"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction } from "@/app/auth-actions";
import { initialAuthActionState } from "@/lib/auth/types";

import styles from "./auth-form.module.css";
import { AuthStatus, FieldError } from "./form-parts";

export function LoginForm({ next = "" }: { next?: string }) {
  const [state, action, pending] = useActionState(
    loginAction,
    initialAuthActionState,
  );
  const emailErrors = state.fieldErrors?.email;
  const passwordErrors = state.fieldErrors?.password;

  return (
    <form action={action} className={styles.form} noValidate>
      <input name="next" type="hidden" value={next} />
      <AuthStatus state={state} />

      <div className={styles.field}>
        <label className={styles.label} htmlFor="login-email">
          Email address
        </label>
        <input
          aria-describedby={emailErrors ? "login-email-error" : undefined}
          aria-invalid={Boolean(emailErrors)}
          autoComplete="email"
          className={styles.input}
          id="login-email"
          name="email"
          required
          type="email"
        />
        <FieldError errors={emailErrors} id="login-email-error" />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="login-password">
          Password
        </label>
        <input
          aria-describedby={passwordErrors ? "login-password-error" : undefined}
          aria-invalid={Boolean(passwordErrors)}
          autoComplete="current-password"
          className={styles.input}
          id="login-password"
          name="password"
          required
          type="password"
        />
        <FieldError errors={passwordErrors} id="login-password-error" />
      </div>

      <button className={styles.submit} disabled={pending} type="submit">
        {pending ? "Logging in…" : "Log in securely"}
      </button>

      <p className={styles.formLink}>
        <Link href="/forgot-password">Forgot your password?</Link>
      </p>
      <p className={styles.formLink}>
        New to TrueCheckDating.com?{" "}
        <Link href="/signup">Create an account</Link>
      </p>
    </form>
  );
}
