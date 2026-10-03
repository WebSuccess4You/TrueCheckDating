import { readableCategory, readableConcernLevel } from "@/lib/ai/format";
import type { ChatAnalysisRecord } from "@/lib/ai/types";

import styles from "./chat-analysis.module.css";

function ScoreCard({ label, value }: { label: string; value: string }) {
  return (
    <article className={styles.scoreCard}>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

export function ChatAnalysisResults({
  analysis,
}: {
  analysis: ChatAnalysisRecord;
}) {
  if (analysis.status !== "completed") return null;

  const categoryScores = analysis.category_scores ?? {
    communication_manipulation: 0,
    financial_pressure: 0,
    identity_consistency: 0,
    verification_behavior: 0,
    urgency_and_isolation: 0,
  };

  return (
    <section className={styles.results} aria-labelledby="analysis-heading">
      <div className={styles.resultHeader}>
        <div>
          <p className={styles.eyebrow}>Preliminary chat analysis</p>
          <h2 id="analysis-heading">
            {readableConcernLevel(analysis.concern_level)} concern
          </h2>
        </div>
        <span className={styles.notProof}>Risk indicator · not proof</span>
      </div>

      <div className={styles.scoreGrid} aria-label="Analysis scores">
        <ScoreCard
          label="Chat risk indicator"
          value={`${analysis.risk_score ?? 0}/100`}
        />
        <ScoreCard
          label={`${readableConcernLevel(analysis.confidence_level)} confidence`}
          value={`${analysis.confidence_score ?? 0}/100`}
        />
        <ScoreCard
          label="Evidence completeness"
          value={`${analysis.evidence_completeness ?? 0}%`}
        />
      </div>

      <article className={styles.summaryPanel}>
        <h3>How to read this analysis</h3>
        <p>
          Review the quoted warning signs and their explanations below. This
          preliminary score reflects only the submitted conversation and cannot
          establish identity or intent.
        </p>
      </article>

      <section className={styles.resultSection} aria-labelledby="categories">
        <h3 id="categories">Category indicators</h3>
        <div className={styles.categoryList}>
          {Object.entries(categoryScores).map(([category, score]) => (
            <div className={styles.categoryRow} key={category}>
              <div>
                <span>{readableCategory(category)}</span>
                <strong>{score}/100</strong>
              </div>
              <progress max="100" value={score}>
                {score}%
              </progress>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.resultSection} aria-labelledby="warning-signs">
        <h3 id="warning-signs">Warning signs found</h3>
        {analysis.red_flags?.length ? (
          <div className={styles.findingList}>
            {analysis.red_flags.map((finding, index) => (
              <article
                className={styles.findingCard}
                key={`${finding.category}-${index}`}
              >
                <div className={styles.findingHeading}>
                  <strong>{readableCategory(finding.category)}</strong>
                  <span>{readableConcernLevel(finding.severity)} severity</span>
                </div>
                <blockquote>“{finding.evidence_excerpt}”</blockquote>
                <p>{finding.observation}</p>
                <p className={styles.why}>{finding.why_it_matters}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.emptyResult}>
            No specific warning-sign excerpt met the analyzer’s evidence rules.
          </p>
        )}
      </section>

      <section
        className={styles.resultSection}
        aria-labelledby="protective-signals"
      >
        <h3 id="protective-signals">
          Protective actions and contextual signals
        </h3>
        <p>
          A user&apos;s boundaries can reduce their own exposure. They do not
          verify or reassure us about the person being assessed.
        </p>
        {analysis.protective_signals?.length ? (
          <div className={styles.findingList}>
            {analysis.protective_signals.map((finding, index) => (
              <article
                className={styles.protectiveCard}
                key={`${finding.category}-${index}`}
              >
                <strong>{readableCategory(finding.category)}</strong>
                <blockquote>“{finding.evidence_excerpt}”</blockquote>
                <p>{finding.observation}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.emptyResult}>
            The supplied text did not contain enough clear protective evidence.
          </p>
        )}
      </section>

      <section className={styles.resultSection} aria-labelledby="next-actions">
        <h3 id="next-actions">Recommended next steps</h3>
        <ol className={styles.actionList}>
          {(analysis.recommended_actions ?? []).map((item, index) => (
            <li key={`${item.priority}-${index}`}>
              <strong>{item.action}</strong>
              <span>{item.reason}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.limitations} aria-labelledby="limitations">
        <h3 id="limitations">Limitations</h3>
        <ul>
          {(analysis.limitations ?? []).map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
        <p>
          This analysis is based only on the submitted text. It cannot establish
          legal identity, motive, criminality, authenticity, or personal safety.
        </p>
      </section>

      <details className={styles.technicalDetails}>
        <summary>Analysis version details</summary>
        <dl>
          <div>
            <dt>Prompt version</dt>
            <dd>{analysis.prompt_version}</dd>
          </div>
          <div>
            <dt>Model</dt>
            <dd>{analysis.model_identifier}</dd>
          </div>
          <div>
            <dt>Schema version</dt>
            <dd>{analysis.schema_version}</dd>
          </div>
        </dl>
      </details>
    </section>
  );
}
