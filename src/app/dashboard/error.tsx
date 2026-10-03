"use client";

import Link from "next/link";

import styles from "../case-pages.module.css";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <main>
      <p className={styles.eyebrow}>Private case dashboard</p>
      <h1>Your cases could not be loaded.</h1>
      <p className={styles.lead}>
        No case details are shown. Try the request again or return later.
      </p>
      <div className={styles.actionBar}>
        <button className={styles.primaryLink} onClick={reset} type="button">
          Try again
        </button>
        <Link className={styles.secondaryLink} href="/account">
          Account settings
        </Link>
      </div>
    </main>
  );
}
