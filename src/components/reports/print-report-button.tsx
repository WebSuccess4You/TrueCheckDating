"use client";

import styles from "./report.module.css";

export function PrintReportButton() {
  return (
    <button
      className={styles.printButton}
      type="button"
      onClick={() => window.print()}
    >
      Print or save as PDF
    </button>
  );
}
