import Link from "next/link";

import styles from "../../case-pages.module.css";

export default function CaseNotFound() {
  return (
    <main>
      <p className={styles.eyebrow}>Private case</p>
      <h1>Case not found.</h1>
      <p className={styles.lead}>
        The case may have been deleted, or it does not belong to this account.
      </p>
      <div className={styles.actionBar}>
        <Link className={styles.primaryLink} href="/dashboard">
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}
