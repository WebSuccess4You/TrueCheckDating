import Link from "next/link";

import type { CaseAssessmentRecord } from "@/lib/scoring/types";

import styles from "./preliminary-result.module.css";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className={styles.metric}>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

export function PreliminaryResult({
  assessment,
  caseId,
  outdated,
  hasFullReportAccess = false,
}: {
  assessment: CaseAssessmentRecord;
  caseId: string;
  outdated: boolean;
  hasFullReportAccess?: boolean;
}) {
  if (assessment.status === "not_ready") {
    return (
      <section className={styles.notReady} aria-labelledby="not-ready-heading">
        <p className={styles.eyebrow}>Evidence checkpoint</p>
        <h2 id="not-ready-heading">More information is needed</h2>
        <p>
          Complete the Chat Analyzer and at least one of the Profile, Video, or
          Image checks before TrueCheckDating.com displays a combined concern
          score. Missing evidence is not counted as high risk.
        </p>
        {assessment.missing_sources.length ? (
          <ul>
            {assessment.missing_sources.map((source) => (
              <li key={source}>{source}</li>
            ))}
          </ul>
        ) : null}
      </section>
    );
  }

  return (
    <div className={styles.results}>
      {outdated ? (
        <p className={styles.outdated} role="status">
          One or more checks changed after this result was calculated. Use the
          recalculate button to refresh it.
        </p>
      ) : null}

      <section className={styles.summary} aria-labelledby="result-heading">
        <div className={styles.resultHeader}>
          <div>
            <p className={styles.eyebrow}>Free preliminary result</p>
            <h2 id="result-heading">{assessment.concern_level} concern</h2>
          </div>
          <span>Risk indicator · not proof</span>
        </div>

        <div className={styles.metrics}>
          <Metric
            label="Combined concern indicator"
            value={`${assessment.overall_score ?? 0}/100`}
          />
          <Metric
            label={`${assessment.confidence_level} confidence`}
            value={`${assessment.confidence_score}/100`}
          />
          <Metric
            label={`${assessment.evidence_completeness_level} evidence coverage`}
            value={`${assessment.evidence_completeness}%`}
          />
        </div>

        <p className={styles.explanation}>
          This result combines only completed checks. Unfinished checks are
          excluded rather than treated as suspicious. Confidence and evidence
          coverage show how much weight to place on the concern score.
        </p>
      </section>

      <section
        className={styles.components}
        aria-labelledby="components-heading"
      >
        <h3 id="components-heading">Component indicators</h3>
        <div className={styles.componentList}>
          {assessment.component_scores.map((component) => (
            <article className={styles.component} key={component.key}>
              <div>
                <strong>{component.label}</strong>
                <span>{component.weight}% planned weight</span>
              </div>
              {component.included && component.score !== null ? (
                <>
                  <b>{component.score}/100</b>
                  <progress max="100" value={component.score}>
                    {component.score}%
                  </progress>
                </>
              ) : (
                <em>Not included</em>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className={styles.nextSteps} aria-labelledby="next-heading">
        <h3 id="next-heading">What to do now</h3>
        <ul>
          <li>Do not send money because of urgency, guilt, or threats.</li>
          <li>Independently verify important identity and life claims.</li>
          <li>
            Use a normal live video conversation before major commitments.
          </li>
          <li>
            Discuss the evidence with a trusted person outside the relationship.
          </li>
        </ul>
      </section>

      {hasFullReportAccess ? (
        <section
          className={styles.nextSteps}
          aria-labelledby="full-report-heading"
        >
          <h3 id="full-report-heading">Full report access is active</h3>
          <p>
            Generate or open the detailed, versioned report with evidence,
            explanations, recommendations, limitations, and print-to-PDF export.
          </p>
          <Link className={styles.backLink} href={`/cases/${caseId}/report`}>
            Open full report
          </Link>
        </section>
      ) : (
        <section className={styles.locked} aria-labelledby="locked-heading">
          <div>
            <p className={styles.eyebrow}>Full report preview</p>
            <h3 id="locked-heading">Detailed report sections are locked</h3>
            <p>
              Secure checkout and entitlement verification are available below.
              Purchase access to generate the detailed warning-sign
              explanations, cross-check findings, tailored action plan, and
              printable report.
            </p>
          </div>
          <div
            className={styles.lockedGrid}
            aria-label="Locked report sections"
          >
            <span>Detailed evidence review</span>
            <span>Cross-check explanations</span>
            <span>Personalized action plan</span>
            <span>Printable or downloadable report</span>
          </div>
          <div className={styles.pricePreview}>
            <strong>Approved test pricing</strong>
            <span>$9.99 individual report · $14.99 monthly membership</span>
          </div>
        </section>
      )}

      <section className={styles.limitations} aria-labelledby="limits-heading">
        <h3 id="limits-heading">Limitations</h3>
        <ul>
          {assessment.limitations.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </section>

      <details className={styles.version}>
        <summary>Scoring version details</summary>
        <dl>
          <div>
            <dt>Scoring version</dt>
            <dd>{assessment.scoring_version}</dd>
          </div>
          <div>
            <dt>Available scoring weight</dt>
            <dd>{assessment.available_weight}%</dd>
          </div>
          <div>
            <dt>Calculated</dt>
            <dd>{new Date(assessment.created_at).toLocaleString()}</dd>
          </div>
        </dl>
      </details>

      <Link className={styles.backLink} href={`/cases/${caseId}`}>
        Return to case overview
      </Link>
    </div>
  );
}
