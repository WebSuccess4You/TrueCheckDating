import { calculateCheckCompletion } from "@/lib/cases/progress";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CaseActions } from "@/components/cases/case-actions";
import { PrivateShell } from "@/components/private/private-shell";
import { requireUser } from "@/lib/auth/user";
import {
  formatCaseDate,
  formatUpdatedAt,
  readableCaseStatus,
} from "@/lib/cases/format";
import { getLatestOwnedChatSubmission } from "@/lib/chat/queries";
import { getOwnedCase } from "@/lib/cases/queries";
import { getOwnedImageCheck } from "@/lib/image/queries";
import { getOwnedProfileCheck } from "@/lib/profile/queries";
import { getLatestOwnedCaseAssessment } from "@/lib/scoring/queries";
import { getOwnedVideoCheck } from "@/lib/video/queries";

import styles from "../../case-pages.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Private Case" };

export default async function CaseOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const user = await requireUser();
  const { caseId } = await params;
  const query = await searchParams;
  const caseRecord = await getOwnedCase(user.id, caseId);
  if (!caseRecord) notFound();
  const [
    latestChatSubmission,
    profileCheck,
    imageCheck,
    videoCheck,
    latestAssessment,
  ] = await Promise.all([
    getLatestOwnedChatSubmission(user.id, caseId),
    getOwnedProfileCheck(user.id, caseId),
    getOwnedImageCheck(user.id, caseId),
    getOwnedVideoCheck(user.id, caseId),
    getLatestOwnedCaseAssessment(user.id, caseId),
  ]);
  const imageReviewed =
    imageCheck?.status === "completed" &&
    imageCheck.result_category !== "unclear";
  const completionPercent = calculateCheckCompletion(
    latestChatSubmission,
    profileCheck,
    imageCheck,
    videoCheck,
  );

  return (
    <PrivateShell email={user.email}>
      <div className={styles.headerRow}>
        <section className={styles.headerBlock}>
          <p className={styles.eyebrow}>
            {readableCaseStatus(caseRecord.status)} private case
          </p>
          <h1>{caseRecord.private_nickname}</h1>
          <p className={styles.lead}>
            This overview organizes the checks that will contribute to the final
            report. A score is not proof of identity, criminality, or safety.
          </p>
        </section>
        <Link
          className={styles.secondaryLink}
          href={`/cases/${caseRecord.id}/edit`}
        >
          Edit case details
        </Link>
      </div>

      {query.message ? (
        <p className={styles.message} role="status">
          {query.message}
        </p>
      ) : null}

      <div className={styles.actionBar}>
        <Link className={styles.secondaryLink} href="/dashboard">
          Back to dashboard
        </Link>
      </div>

      <div className={styles.summaryGrid} aria-label="Case progress">
        <article className={styles.summaryCard}>
          <strong>{completionPercent}%</strong>
          <span>Checks complete</span>
        </article>
        <article className={styles.summaryCard}>
          <strong>{caseRecord.latest_concern_level ?? "â€”"}</strong>
          <span>Concern level not calculated</span>
        </article>
        <article className={styles.summaryCard}>
          <strong>{caseRecord.latest_risk_score ?? "â€”"}</strong>
          <span>Risk indicator not calculated</span>
        </article>
      </div>

      <section
        className={styles.section}
        aria-labelledby="case-details-heading"
      >
        <article className={styles.detailCard}>
          <h2 id="case-details-heading">Case details</h2>
          <dl className={styles.details}>
            <div>
              <dt>Platform</dt>
              <dd>{caseRecord.communication_platform ?? "Not provided"}</dd>
            </div>
            <div>
              <dt>Claimed name or alias</dt>
              <dd>{caseRecord.claimed_name_or_alias ?? "Not provided"}</dd>
            </div>
            <div>
              <dt>Claimed location</dt>
              <dd>{caseRecord.claimed_location ?? "Not provided"}</dd>
            </div>
            <div>
              <dt>Communication began</dt>
              <dd>{formatCaseDate(caseRecord.communication_started_on)}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatUpdatedAt(caseRecord.created_at)}</dd>
            </div>
            <div>
              <dt>Last updated</dt>
              <dd>{formatUpdatedAt(caseRecord.updated_at)}</dd>
            </div>
          </dl>
          <CaseActions
            caseId={caseRecord.id}
            caseNickname={caseRecord.private_nickname}
            status={caseRecord.status}
          />
        </article>
      </section>

      <section
        className={styles.section}
        aria-labelledby="verification-steps-heading"
      >
        <div className={styles.sectionHeading}>
          <h2 id="verification-steps-heading">Verification steps</h2>
          <p>Current and upcoming checks</p>
        </div>
        <div className={styles.stepsGrid}>
          <article className={styles.stepCard}>
            <h2>AI Chat Analyzer</h2>
            <p>
              Paste, validate, and encrypt conversation text, then run a
              structured AI analysis with evidence-based findings.
            </p>
            <span className={styles.stepStatus}>
              {latestChatSubmission
                ? "Conversation ready for analysis"
                : "Ready to start"}
            </span>
            <div className={styles.actionBar}>
              <Link
                className={styles.primaryLink}
                href={`/cases/${caseRecord.id}/chat`}
              >
                {latestChatSubmission
                  ? "View chat submissions"
                  : "Add conversation text"}
              </Link>
            </div>
          </article>
          <article className={styles.stepCard}>
            <h2>Profile Consistency Check</h2>
            <p>
              Compare claimed facts, contradictions, social-profile history,
              money requests, and verification cooperation.
            </p>
            <span className={styles.stepStatus}>
              {profileCheck?.status === "completed"
                ? `Completed â€” ${profileCheck.component_score ?? "â€”"}/100`
                : profileCheck
                  ? "Progress saved"
                  : "Ready to start"}
            </span>
            <div className={styles.actionBar}>
              <Link
                className={styles.primaryLink}
                href={`/cases/${caseRecord.id}/profile`}
              >
                Open profile check
              </Link>
            </div>
          </article>
          <article className={styles.stepCard}>
            <h2>Guided Reverse Image Checker</h2>
            <p>
              Use external visual-search tools, inspect source pages, and
              privately record the result without making public accusations.
            </p>
            <span className={styles.stepStatus}>
              {imageReviewed
                ? `Completed â€” ${imageCheck.component_score ?? "â€”"}/100`
                : imageCheck
                  ? "Progress saved"
                  : "Ready to start"}
            </span>
            <div className={styles.actionBar}>
              <Link
                className={styles.primaryLink}
                href={`/cases/${caseRecord.id}/image`}
              >
                Open image checker
              </Link>
            </div>
          </article>
          <article className={styles.stepCard}>
            <h2>Video Call Verifier</h2>
            <p>
              Record live-call history, avoidance patterns, simple verification
              behavior, pressure, and protective signals without recording the
              other person.
            </p>
            <span className={styles.stepStatus}>
              {videoCheck?.status === "completed"
                ? `Completed â€” ${videoCheck.component_score ?? "â€”"}/100`
                : videoCheck
                  ? "Progress saved"
                  : "Ready to start"}
            </span>
            <div className={styles.actionBar}>
              <Link
                className={styles.primaryLink}
                href={`/cases/${caseRecord.id}/video`}
              >
                Open video verifier
              </Link>
            </div>
          </article>
          <article className={styles.stepCard}>
            <h2>Combined Preliminary Result</h2>
            <p>
              Combine completed checks with fixed weights, evidence coverage,
              and confidence. Missing checks are excluded rather than scored as
              suspicious.
            </p>
            <span className={styles.stepStatus}>
              {latestAssessment?.status === "preliminary"
                ? `${latestAssessment.concern_level} â€” ${latestAssessment.overall_score ?? "â€”"}/100`
                : latestAssessment
                  ? "More evidence needed"
                  : "Ready to calculate"}
            </span>
            <div className={styles.actionBar}>
              <Link
                className={styles.primaryLink}
                href={`/cases/${caseRecord.id}/results`}
              >
                Open preliminary result
              </Link>
            </div>
          </article>
        </div>
      </section>
    </PrivateShell>
  );
}
