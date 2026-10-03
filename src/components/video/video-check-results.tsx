import { videoQuestions } from "@/lib/video/constants";
import { videoConcernLabel } from "@/lib/video/scoring";
import type { VideoCheckRecord } from "@/lib/video/types";

import styles from "./video-check.module.css";

function answerLabel(questionKey: string, answer: string): string {
  const question = videoQuestions.find((item) => item.key === questionKey);
  return (
    question?.options.find((option) => option.value === answer)?.label ?? answer
  );
}

export function VideoCheckResults({ check }: { check: VideoCheckRecord }) {
  if (check.status !== "completed") return null;
  const concern = videoConcernLabel(check.component_score);
  const answeredCount = Object.keys(check.answers).length;

  return (
    <section
      className={styles.resultGrid}
      aria-labelledby="video-result-heading"
    >
      <article className={styles.resultCard}>
        <h2 id="video-result-heading">Video Call Verifier result</h2>
        <p>
          This result organizes the observations you recorded.
          TrueCheckDating.com did not watch, record, identify, or independently
          verify the person on the call.
        </p>
      </article>

      <div className={styles.scoreCards} aria-label="Video check scores">
        <article className={styles.summaryCard}>
          <strong>{check.component_score ?? "—"}/100</strong>
          <span>{concern} video-verification concern</span>
        </article>
        <article className={styles.summaryCard}>
          <strong>{check.evidence_completeness}%</strong>
          <span>Evidence completeness</span>
        </article>
        <article className={styles.summaryCard}>
          <strong>{answeredCount}</strong>
          <span>Checklist areas recorded</span>
        </article>
      </div>

      <article
        className={
          check.avoidance_patterns.length
            ? styles.warningCard
            : styles.protectiveCard
        }
      >
        <h3>Summary</h3>
        <p>{check.summary}</p>
      </article>

      {check.avoidance_patterns.length ? (
        <article className={styles.warningCard}>
          <h3>Recorded warning patterns</h3>
          <ul>
            {check.avoidance_patterns.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      ) : null}

      {check.protective_signals.length ? (
        <article className={styles.protectiveCard}>
          <h3>Protective or reassuring signals</h3>
          <ul>
            {check.protective_signals.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      ) : null}

      <details className={styles.resultCard}>
        <summary>Recorded checklist answers</summary>
        <dl className={styles.answerList}>
          {videoQuestions.map((question) => {
            const answer = check.answers[question.key];
            if (!answer) return null;
            return (
              <div key={question.key}>
                <dt>{question.label}</dt>
                <dd>{answerLabel(question.key, answer)}</dd>
              </div>
            );
          })}
        </dl>
      </details>

      {check.notes ? (
        <details className={styles.resultCard}>
          <summary>Private notes</summary>
          <p className={styles.preserveWhitespace}>{check.notes}</p>
        </details>
      ) : null}

      <article className={styles.safetyResult}>
        <h3>Required limitation</h3>
        <p>
          A normal live call can reduce uncertainty but cannot prove legal
          identity, honesty, intent, or future safety. Avoid secret recording,
          financial transfers, travel, or major commitments until important
          claims are independently verified.
        </p>
      </article>
    </section>
  );
}
