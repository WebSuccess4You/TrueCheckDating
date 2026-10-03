import Link from "next/link";

import { formatUpdatedAt, readableCaseStatus } from "@/lib/cases/format";
import type { CaseRecord } from "@/lib/cases/types";

import { CaseActions } from "./case-actions";
import styles from "./case-card.module.css";

export function CaseCard({ caseRecord }: { caseRecord: CaseRecord }) {
  return (
    <article className={styles.card}>
      <div className={styles.headingRow}>
        <div>
          <p className={styles.status}>
            {readableCaseStatus(caseRecord.status)}
          </p>
          <h3>
            <Link href={`/cases/${caseRecord.id}`}>
              {caseRecord.private_nickname}
            </Link>
          </h3>
        </div>
        <span className={styles.progress}>
          {caseRecord.completion_percent}%
        </span>
      </div>

      <dl className={styles.details}>
        <div>
          <dt>Platform</dt>
          <dd>{caseRecord.communication_platform ?? "Not provided"}</dd>
        </div>
        <div>
          <dt>Claimed location</dt>
          <dd>{caseRecord.claimed_location ?? "Not provided"}</dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>{formatUpdatedAt(caseRecord.updated_at)}</dd>
        </div>
      </dl>

      <div className={styles.openRow}>
        <Link className={styles.openLink} href={`/cases/${caseRecord.id}`}>
          Open case
        </Link>
        <Link className={styles.editLink} href={`/cases/${caseRecord.id}/edit`}>
          Edit details
        </Link>
      </div>

      <CaseActions
        caseId={caseRecord.id}
        caseNickname={caseRecord.private_nickname}
        compact
        status={caseRecord.status}
      />
    </article>
  );
}
