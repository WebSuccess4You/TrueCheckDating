"use client";

import { useActionState } from "react";

import { createBillingPortalAction } from "@/app/payment-actions";

import styles from "./payments.module.css";

const initialState = { status: "idle" as const };

export function BillingPortalButton() {
  const [state, action, pending] = useActionState(
    createBillingPortalAction,
    initialState,
  );
  return (
    <form action={action} className={styles.checkoutForm}>
      <button
        className={styles.secondaryButton}
        disabled={pending}
        type="submit"
      >
        {pending ? "Opening billing portal…" : "Manage billing in Stripe"}
      </button>
      {state.status === "error" ? (
        <p className={styles.error} role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
