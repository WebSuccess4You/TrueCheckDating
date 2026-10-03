import type { ReportSnapshotRecord } from "@/lib/reports/types";

import { PrintReportButton } from "./print-report-button";
import styles from "./report.module.css";

function formatDate(value: string | null): string {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function FinalReport({
  report,
  outdated,
}: {
  report: ReportSnapshotRecord;
  outdated: boolean;
}) {
  const body = report.report_body;
  return (
    <article className={styles.report} aria-labelledby="final-report-title">
      <header className={styles.reportHeader}>
        <div>
          <p className={styles.eyebrow}>TrueCheckDating.com final report</p>
          <h1 id="final-report-title">{body.caseLabel}</h1>
          <p>
            Version {report.report_version_number} · Generated{" "}
            {formatDate(report.generated_at)}
          </p>
        </div>
        <div className={styles.noPrint}>
          <PrintReportButton />
          <p>In the print window, choose “Save as PDF” to create a PDF copy.</p>
        </div>
      </header>

      {outdated ? (
        <p className={`${styles.notice} ${styles.noPrint}`} role="status">
          One or more case checks changed after this report was generated. This
          saved snapshot remains available, but generate an updated version for
          current findings.
        </p>
      ) : null}

      <section
        className={styles.summary}
        aria-labelledby="report-summary-heading"
      >
        <div>
          <p className={styles.eyebrow}>Overall assessment</p>
          <h2 id="report-summary-heading">{report.concern_level} concern</h2>
          <span className={styles.notProof}>Concern indicator · not proof</span>
        </div>
        <div className={styles.metrics}>
          <div>
            <strong>{report.overall_score}/100</strong>
            <span>Concern</span>
          </div>
          <div>
            <strong>{report.confidence_score}/100</strong>
            <span>{report.confidence_level} confidence</span>
          </div>
          <div>
            <strong>{report.evidence_completeness}%</strong>
            <span>{report.evidence_completeness_level} coverage</span>
          </div>
        </div>
        <p>{body.summary}</p>
      </section>

      <section
        className={styles.section}
        aria-labelledby="evidence-reviewed-heading"
      >
        <h2 id="evidence-reviewed-heading">Evidence reviewed</h2>
        <div className={styles.evidenceGrid}>
          {body.evidenceReviewed.map((item) => (
            <article key={item.source} className={styles.evidenceCard}>
              <div>
                <strong>{item.source}</strong>
                <span>{item.status}</span>
              </div>
              <p>{item.description}</p>
              <small>
                {item.reviewedAt
                  ? `Reviewed ${formatDate(item.reviewedAt)}`
                  : "Not included"}
                {item.version ? ` · Version ${item.version}` : ""}
              </small>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="warnings-heading">
        <h2 id="warnings-heading">Principal warning signs</h2>
        {body.warningSigns.length ? (
          <div className={styles.findingList}>
            {body.warningSigns.map((finding, index) => (
              <article
                key={`${finding.source}-${index}`}
                className={styles.finding}
              >
                <header>
                  <strong>{finding.category}</strong>
                  <span>
                    {finding.severity} · {finding.source}
                  </span>
                </header>
                <dl>
                  <div>
                    <dt>Evidence</dt>
                    <dd>{finding.evidence}</dd>
                  </div>
                  <div>
                    <dt>System observation</dt>
                    <dd>{finding.observation}</dd>
                  </div>
                  <div>
                    <dt>Why it may matter</dt>
                    <dd>{finding.interpretation}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <p>
            No principal warning sign was recorded in the completed evidence.
            This does not guarantee safety.
          </p>
        )}
      </section>

      <section className={styles.section} aria-labelledby="protective-heading">
        <h2 id="protective-heading">
          Protective actions and contextual signals
        </h2>
        <p>
          A user&apos;s boundaries can reduce their own exposure. They do not
          verify or reassure us about the person being assessed.
        </p>
        {body.protectiveSignals.length ? (
          <div className={styles.signalList}>
            {body.protectiveSignals.map((signal, index) => (
              <article
                key={`${signal.source}-${index}`}
                className={styles.signal}
              >
                <strong>{signal.source}</strong>
                <p>{signal.observation}</p>
                <small>Evidence: {signal.evidence}</small>
              </article>
            ))}
          </div>
        ) : (
          <p>
            No clear protective signal was recorded. Absence of a protective
            signal is not proof of deception.
          </p>
        )}
      </section>

      <section className={styles.section} aria-labelledby="breakdown-heading">
        <h2 id="breakdown-heading">Component breakdown</h2>
        <div className={styles.componentList}>
          {body.componentBreakdown.map((component) => (
            <div key={component.key} className={styles.component}>
              <div>
                <strong>{component.label}</strong>
                <span>{component.weight}% planned weight</span>
              </div>
              <b>
                {component.included && component.score !== null
                  ? `${component.score}/100`
                  : "Not included"}
              </b>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="actions-heading">
        <h2 id="actions-heading">Recommended next steps</h2>
        <ol className={styles.actionList}>
          {body.recommendations.map((item, index) => (
            <li key={`${item.action}-${index}`}>
              <div>
                <span>{item.priority}</span>
                <strong>{item.action}</strong>
              </div>
              <p>{item.reason}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="limitations-heading">
        <h2 id="limitations-heading">Limitations</h2>
        <ul className={styles.limitations}>
          {body.limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <footer className={styles.reportFooter}>
        <p>
          <strong>Important:</strong> {body.disclaimer}
        </p>
        <dl>
          <div>
            <dt>Report version</dt>
            <dd>{report.report_version_number}</dd>
          </div>
          <div>
            <dt>Scoring version</dt>
            <dd>{report.scoring_version}</dd>
          </div>
          <div>
            <dt>Report content version</dt>
            <dd>{report.report_content_version}</dd>
          </div>
          <div>
            <dt>AI prompt version</dt>
            <dd>{report.prompt_version ?? "Not available"}</dd>
          </div>
          <div>
            <dt>AI model identifier</dt>
            <dd>{report.model_identifier ?? "Not available"}</dd>
          </div>
        </dl>
      </footer>
    </article>
  );
}
