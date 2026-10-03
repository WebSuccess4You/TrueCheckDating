import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FinalReport } from "@/components/reports/final-report";
import { GenerateReportForm } from "@/components/reports/generate-report-form";
import { PrivateShell } from "@/components/private/private-shell";
import { getLatestCompletedOwnedChatAnalysis } from "@/lib/ai/queries";
import { requireUser } from "@/lib/auth/user";
import { getOwnedCase } from "@/lib/cases/queries";
import { getOwnedImageCheck } from "@/lib/image/queries";
import { getEntitlementSummary } from "@/lib/payments/queries";
import { getOwnedProfileCheck } from "@/lib/profile/queries";
import { isReportOutdated } from "@/lib/reports/outdated";
import { getLatestOwnedReport } from "@/lib/reports/queries";
import { buildCombinedScoringInput } from "@/lib/scoring/input";
import { calculateCombinedAssessment } from "@/lib/scoring/scoring";
import { getOwnedVideoCheck } from "@/lib/video/queries";

import styles from "@/components/reports/report.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Final Report" };

export default async function FinalReportPage({
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
    entitlement,
    report,
    chatAnalysis,
    profileCheck,
    videoCheck,
    imageCheck,
  ] = await Promise.all([
    getEntitlementSummary(user.id, caseId),
    getLatestOwnedReport(user.id, caseId),
    getLatestCompletedOwnedChatAnalysis(user.id, caseId),
    getOwnedProfileCheck(user.id, caseId),
    getOwnedVideoCheck(user.id, caseId),
    getOwnedImageCheck(user.id, caseId),
  ]);

  const current = calculateCombinedAssessment(
    buildCombinedScoringInput({
      chatAnalysis,
      profileCheck,
      videoCheck,
      imageCheck,
    }),
  );
  const outdated = report
    ? isReportOutdated(report.source_fingerprints, current.sourceFingerprints)
    : false;

  return (
    <PrivateShell email={user.email}>
      <div className={styles.noPrint}>
        <Link href={`/cases/${caseId}/results`}>
          ← Back to preliminary result
        </Link>
        {query.message ? (
          <p className={styles.notice} role="status">
            {query.message}
          </p>
        ) : null}
      </div>

      {!entitlement.hasFullReportAccess ? (
        <section className={styles.generatePanel}>
          <div>
            <p className={styles.eyebrow}>Access required</p>
            <h1>Full report is locked</h1>
            <p>
              A verified individual-report purchase or active membership is
              required. Returning from a checkout page alone does not grant
              access.
            </p>
          </div>
          <Link href={`/cases/${caseId}/results`}>
            Review secure access options
          </Link>
        </section>
      ) : (
        <>
          <GenerateReportForm
            caseId={caseId}
            hasExistingReport={Boolean(report)}
          />
          {report ? (
            <FinalReport report={report} outdated={outdated} />
          ) : (
            <section className={styles.generatePanel}>
              <div>
                <h1>No final report snapshot yet</h1>
                <p>
                  Generate the first entitled report above. The saved snapshot
                  will remain available even when later evidence changes.
                </p>
              </div>
            </section>
          )}
        </>
      )}
    </PrivateShell>
  );
}
