"use client";

import { useActionState } from "react";

import { createCheckoutSessionAction } from "@/app/payment-actions";
import type { PaymentProductCode } from "@/lib/payments/types";

import styles from "./payments.module.css";

const initialState = { status: "idle" as const };

export function CheckoutButton({
  productCode,
  caseId,
  children,
  secondary = false,
}: {
  productCode: PaymentProductCode;
  caseId?: string;
  children: React.ReactNode;
  secondary?: boolean;
}) {
  const [state, action, pending] = useActionState(
    createCheckoutSessionAction,
    initialState,
  );

  return (
    <form action={action} className={styles.checkoutForm}>
      <input type="hidden" name="productCode" value={productCode} />
      {caseId ? <input type="hidden" name="caseId" value={caseId} /> : null}
      <button
        className={secondary ? styles.secondaryButton : styles.primaryButton}
        disabled={pending}
        type="submit"
      >
        {pending ? "Opening secure checkout…" : children}
      </button>
      {state.status === "error" ? (
        <p className={styles.error} role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
