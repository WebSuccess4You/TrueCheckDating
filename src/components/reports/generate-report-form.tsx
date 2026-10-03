"use client";

import { useActionState } from "react";

import { generateFinalReportAction } from "@/app/report-actions";
import { initialGenerateReportActionState } from "@/lib/reports/types";

import styles from "./report.module.css";

export function GenerateReportForm({
  caseId,
  hasExistingReport = false,
}: {
  caseId: string;
  hasExistingReport?: boolean;
}) {
  const [state, action, pending] = useActionState(
    generateFinalReportAction,
    initialGenerateReportActionState,
  );
  return (
    <form action={action} className={styles.generatePanel}>
      <input type="hidden" name="caseId" value={caseId} />
      <div>
        <p className={styles.eyebrow}>Verified full-report access</p>
        <h2>
          {hasExistingReport
            ? "Generate an updated report version"
            : "Generate the complete report"}
        </h2>
        <p>
          The report is saved as an immutable snapshot. It excludes the raw
          transcript, private notes, account email, payment details, and secret
          identifiers.
        </p>
      </div>
      <button className={styles.primaryButton} type="submit" disabled={pending}>
        {pending
          ? "Generating report…"
          : hasExistingReport
            ? "Generate updated version"
            : "Generate full report"}
      </button>
      {state.status === "error" ? (
        <p className={styles.error} role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
