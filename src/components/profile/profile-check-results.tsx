import { getAnswerLabel, profileConcernLabel } from "@/lib/profile/scoring";
import type { ProfileCheckRecord } from "@/lib/profile/types";

import styles from "./profile-check-form.module.css";

export function ProfileCheckResults({ check }: { check: ProfileCheckRecord }) {
  if (check.status !== "completed") return null;

  const concern = profileConcernLabel(check.component_score);

  return (
    <section
      className={styles.resultGrid}
      aria-labelledby="profile-result-heading"
    >
      <article className={styles.resultCard}>
        <h2 id="profile-result-heading">Profile consistency result</h2>
        <p>
          This component reviews the answers you supplied. It does not prove a
          person’s identity, intentions, criminality, or safety.
        </p>
      </article>

      <div className={styles.scoreCards} aria-label="Profile check scores">
        <article className={styles.summaryCard}>
          <strong>{check.component_score ?? "—"}/100</strong>
          <span>{concern} profile concern</span>
        </article>
        <article className={styles.summaryCard}>
          <strong>{check.evidence_completeness}%</strong>
          <span>Evidence completeness</span>
        </article>
        <article className={styles.summaryCard}>
          <strong>{check.contradictions.length}</strong>
          <span>Inconsistency or risk indicators</span>
        </article>
      </div>

      {check.summary ? (
        <article className={styles.resultCard}>
          <h3>Summary</h3>
          <p>{check.summary}</p>
        </article>
      ) : null}

      <article className={styles.warningCard}>
        <h3>Inconsistencies and concerns</h3>
        {check.contradictions.length ? (
          <div className={styles.findingList}>
            {check.contradictions.map((item) => (
              <div className={styles.finding} key={item.key}>
                <strong>{item.label}</strong>
                <p>{item.answer}</p>
                <p>
                  Severity: {item.severity}. Indicator score: {item.score}/100.
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p>
            No profile inconsistency indicators were recorded from the completed
            answers.
          </p>
        )}
      </article>

      <article className={styles.protectiveCard}>
        <h3>Protective or reassuring signals</h3>
        {check.protective_signals.length ? (
          <div className={styles.findingList}>
            {check.protective_signals.map((item) => (
              <div className={styles.finding} key={item.key}>
                <strong>{item.label}</strong>
                <p>{item.answer}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No clear protective profile-consistency signals were recorded.</p>
        )}
      </article>

      <details className={styles.resultCard}>
        <summary>Saved answers</summary>
        <dl>
          {Object.entries(check.answers).map(([key, answer]) =>
            key === "notes" ? null : (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{getAnswerLabel(key as never, String(answer))}</dd>
              </div>
            ),
          )}
        </dl>
      </details>
    </section>
  );
}
