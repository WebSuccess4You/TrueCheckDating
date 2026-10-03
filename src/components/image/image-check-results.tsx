import { imageResultOptions } from "@/lib/image/constants";
import { imageConcernLabel, scoreImageCheck } from "@/lib/image/scoring";
import type { ImageCheckRecord } from "@/lib/image/types";

import styles from "./image-check.module.css";

function displayHost(link: string): string {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return "Saved source";
  }
}

export function ImageCheckResults({ check }: { check: ImageCheckRecord }) {
  if (check.status !== "completed" || !check.result_category) return null;

  const option = imageResultOptions.find(
    (item) => item.value === check.result_category,
  );
  const result = scoreImageCheck(
    check.result_category,
    check.source_links,
    check.notes,
  );
  const inconclusive = check.result_category === "unclear";
  const concern = imageConcernLabel(
    inconclusive ? null : check.component_score,
  );

  return (
    <section
      className={styles.resultGrid}
      aria-labelledby="image-result-heading"
    >
      <article className={styles.resultCard}>
        <h2 id="image-result-heading">Guided reverse image result</h2>
        <p>
          This component records what you found using external search services.
          TrueCheckDating.com did not independently verify the pages or identify
          the person in the image.
        </p>
      </article>

      <div className={styles.scoreCards} aria-label="Image check scores">
        <article className={styles.summaryCard}>
          <strong>
            {inconclusive ? "—" : `${check.component_score ?? "—"}/100`}
          </strong>
          <span>{concern} image-search concern</span>
        </article>
        <article className={styles.summaryCard}>
          <strong>
            {inconclusive ? "—" : `${check.evidence_completeness}%`}
          </strong>
          <span>Evidence completeness</span>
        </article>
        <article className={styles.summaryCard}>
          <strong>{check.source_links.length}</strong>
          <span>Supporting source links saved</span>
        </article>
      </div>

      <article
        className={
          result.classification === "concern"
            ? styles.warningCard
            : result.classification === "protective"
              ? styles.protectiveCard
              : styles.resultCard
        }
      >
        <h3>Recorded finding</h3>
        <p>
          <strong>{option?.label ?? check.result_category}</strong>
        </p>
        <p>{inconclusive ? result.summary : check.summary}</p>
      </article>

      {check.source_links.length ? (
        <article className={styles.resultCard}>
          <h3>Saved source links</h3>
          <p>
            Open and inspect these pages independently. A link appearing here
            does not mean TrueCheckDating.com verified or endorsed its contents.
          </p>
          <ul className={styles.sourceList}>
            {check.source_links.map((link, index) => (
              <li key={`${link}-${index}`}>
                <a href={link} rel="noreferrer" target="_blank">
                  Source {index + 1}: {displayHost(link)}
                </a>
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      {check.notes ? (
        <details className={styles.resultCard}>
          <summary>Private notes</summary>
          <p className={styles.preserveWhitespace}>{check.notes}</p>
        </details>
      ) : null}

      <article className={styles.safetyResult}>
        <h3>Required limitation</h3>
        <p>
          Reverse-image services can miss images, show unrelated look-alikes, or
          return pages with inaccurate names. Do not use this result alone to
          accuse, confront, publish information about, or endanger anyone.
        </p>
      </article>
    </section>
  );
}
