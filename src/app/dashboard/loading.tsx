import styles from "../case-pages.module.css";

export default function DashboardLoading() {
  return (
    <main aria-busy="true" aria-label="Loading private cases">
      <p className={styles.eyebrow}>Private case dashboard</p>
      <h1>Loading your cases…</h1>
      <div className={styles.loadingGrid}>
        <div className={styles.loadingBlock} />
        <div className={styles.loadingBlock} />
        <div className={styles.loadingBlock} />
      </div>
    </main>
  );
}
