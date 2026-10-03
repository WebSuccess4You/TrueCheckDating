"use client";

import Link from "next/link";

import styles from "../../case-pages.module.css";

export default function CaseError({ reset }: { reset: () => void }) {
  return (
    <main>
      <p className={styles.eyebrow}>Private case</p>
      <h1>This case could not be loaded.</h1>
      <p className={styles.lead}>
        The application did not display any case content. Try again or return to
        your dashboard.
      </p>
      <div className={styles.actionBar}>
        <button className={styles.primaryLink} onClick={reset} type="button">
          Try again
        </button>
        <Link className={styles.secondaryLink} href="/dashboard">
          Dashboard
        </Link>
      </div>
    </main>
  );
}
