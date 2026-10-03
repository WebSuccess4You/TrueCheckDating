import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GenerateAssessmentForm } from "@/components/results/generate-assessment-form";
import { PreliminaryResult } from "@/components/results/preliminary-result";
import { ReportAccessPanel } from "@/components/payments/report-access-panel";
import { PrivateShell } from "@/components/private/private-shell";
import { getLatestCompletedOwnedChatAnalysis } from "@/lib/ai/queries";
import { requireUser } from "@/lib/auth/user";
import { getOwnedCase } from "@/lib/cases/queries";
import { getOwnedImageCheck } from "@/lib/image/queries";
import { getOwnedProfileCheck } from "@/lib/profile/queries";
import { getEntitlementSummary } from "@/lib/payments/queries";
import { buildCombinedScoringInput } from "@/lib/scoring/input";
import { getLatestOwnedCaseAssessment } from "@/lib/scoring/queries";
import {
  calculateCombinedAssessment,
  isAssessmentOutdated,
} from "@/lib/scoring/scoring";
import { getOwnedVideoCheck } from "@/lib/video/queries";

import styles from "../../../chat-pages.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preliminary Result" };

export default async function PreliminaryResultPage({
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
    chatAnalysis,
    profileCheck,
    videoCheck,
    imageCheck,
    assessment,
    entitlement,
  ] = await Promise.all([
    getLatestCompletedOwnedChatAnalysis(user.id, caseId),
    getOwnedProfileCheck(user.id, caseId),
    getOwnedVideoCheck(user.id, caseId),
    getOwnedImageCheck(user.id, caseId),
    getLatestOwnedCaseAssessment(user.id, caseId),
    getEntitlementSummary(user.id, caseId),
  ]);

  const currentCalculation = calculateCombinedAssessment(
    buildCombinedScoringInput({
      chatAnalysis,
      profileCheck,
      videoCheck,
      imageCheck,
    }),
  );
  const outdated = assessment
    ? isAssessmentOutdated(
        assessment.source_fingerprints,
        currentCalculation.sourceFingerprints,
      )
    : false;

  return (
    <PrivateShell email={user.email}>
      <div className={styles.headerRow}>
        <section className={styles.headerBlock}>
          <p className={styles.eyebrow}>Combined scoring</p>
          <h1>{caseRecord.private_nickname}</h1>
          <p className={styles.lead}>
            Combine completed checks using fixed, documented weights. Missing
            information lowers evidence coverage; it is not automatically
            treated as suspicious.
          </p>
        </section>
        <Link className={styles.secondaryLink} href={`/cases/${caseRecord.id}`}>
          Back to case overview
        </Link>
      </div>

      {query.message ? (
        <p className={styles.message} role="status">
          {query.message}
        </p>
      ) : null}

      {caseRecord.status !== "active" ? (
        <p className={styles.warning} role="alert">
          This case is archived. Restore it before calculating or refreshing a
          result.
        </p>
      ) : null}

      <section className={styles.section} aria-labelledby="coverage-heading">
        <div className={styles.sectionHeading}>
          <h2 id="coverage-heading">Current evidence coverage</h2>
          <p>{currentCalculation.evidenceCompleteness}% complete</p>
        </div>
        <div className={styles.stepsGrid}>
          {currentCalculation.components.map((component) => (
            <article className={styles.stepCard} key={component.key}>
              <h2>{component.label}</h2>
              <p>
                {component.included && component.score !== null
                  ? `${component.score}/100 concern indicator available.`
                  : "Not currently included in combined scoring."}
              </p>
              <span className={styles.stepStatus}>
                {component.included ? "Available" : "Incomplete or unavailable"}
              </span>
            </article>
          ))}
        </div>
      </section>

      <GenerateAssessmentForm
        caseId={caseRecord.id}
        disabled={caseRecord.status !== "active"}
        label={assessment ? "Recalculate preliminary result" : undefined}
      />

      {assessment ? (
        <>
          <PreliminaryResult
            assessment={assessment}
            caseId={caseRecord.id}
            outdated={outdated}
            hasFullReportAccess={entitlement.hasFullReportAccess}
          />
          {assessment.status === "preliminary" ? (
            <ReportAccessPanel
              caseId={caseRecord.id}
              entitlement={entitlement}
            />
          ) : null}
        </>
      ) : null}
    </PrivateShell>
  );
}
