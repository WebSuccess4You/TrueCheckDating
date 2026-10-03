import styles from "../../case-pages.module.css";

export default function CaseLoading() {
  return (
    <main aria-busy="true" aria-label="Loading private case">
      <p className={styles.eyebrow}>Private case</p>
      <h1>Loading case…</h1>
      <div className={styles.loadingGrid}>
        <div className={styles.loadingBlock} />
        <div className={styles.loadingBlock} />
      </div>
    </main>
  );
}
