"use client";

import { useActionState } from "react";

import { deleteAccountAction } from "@/app/account-deletion-actions";
import { ACCOUNT_DELETION_CONFIRMATION } from "@/lib/account-deletion/constants";
import { initialAccountDeletionActionState } from "@/lib/account-deletion/types";

import styles from "./delete-account-form.module.css";

function FieldError({ errors, id }: { errors?: string[]; id: string }) {
  if (!errors?.length) return null;
  return (
    <p className={styles.error} id={id} role="alert">
      {errors[0]}
    </p>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(
    deleteAccountAction,
    initialAccountDeletionActionState,
  );

  return (
    <form action={action} className={styles.form} noValidate>
      <p className={styles.warning}>
        This permanently removes your TrueCheckDating.com account and private
        cases. Any active membership is canceled first. This action cannot be
        undone.
      </p>

      {state.status === "error" ? (
        <p className={styles.error} role="alert">
          {state.message}
        </p>
      ) : null}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="delete-current-password">
          Current password
        </label>
        <input
          aria-describedby="delete-current-password-error"
          aria-invalid={Boolean(state.fieldErrors?.currentPassword)}
          autoComplete="current-password"
          className={styles.input}
          id="delete-current-password"
          name="currentPassword"
          required
          type="password"
        />
        <FieldError
          errors={state.fieldErrors?.currentPassword}
          id="delete-current-password-error"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="delete-confirmation">
          Type {ACCOUNT_DELETION_CONFIRMATION}
        </label>
        <input
          aria-describedby="delete-confirmation-error"
          aria-invalid={Boolean(state.fieldErrors?.confirmation)}
          autoComplete="off"
          className={styles.input}
          id="delete-confirmation"
          name="confirmation"
          required
          spellCheck={false}
          type="text"
        />
        <FieldError
          errors={state.fieldErrors?.confirmation}
          id="delete-confirmation-error"
        />
      </div>

      <label className={styles.checkbox}>
        <input name="consequencesAcknowledged" type="checkbox" />
        <span>
          I understand that saved cases, analyses, checks, reports, and account
          access will be permanently removed.
        </span>
      </label>
      <FieldError
        errors={state.fieldErrors?.consequencesAcknowledged}
        id="delete-acknowledgement-error"
      />

      <button className={styles.submit} disabled={pending} type="submit">
        {pending
          ? "Canceling access and deleting…"
          : "Permanently delete account"}
      </button>
    </form>
  );
}
