import type { AuthActionState } from "@/lib/auth/types";

import styles from "./auth-form.module.css";

export function FieldError({ errors, id }: { errors?: string[]; id: string }) {
  if (!errors?.length) return null;
  return (
    <p className={styles.error} id={id} role="alert">
      {errors[0]}
    </p>
  );
}

export function AuthStatus({ state }: { state: AuthActionState }) {
  if (state.status === "idle" || !state.message) return null;

  return (
    <div
      aria-live="polite"
      className={`${styles.status} ${
        state.status === "error" ? styles.statusError : styles.statusSuccess
      }`}
      role={state.status === "error" ? "alert" : "status"}
    >
      {state.message}
    </div>
  );
}
