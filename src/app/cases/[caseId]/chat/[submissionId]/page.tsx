import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AnalyzeConversationForm } from "@/components/chat/analyze-conversation-form";
import { ChatAnalysisResults } from "@/components/chat/chat-analysis-results";
import { SavedTextPreview } from "@/components/chat/saved-text-preview";
import { PrivateShell } from "@/components/private/private-shell";
import { requireUser } from "@/lib/auth/user";
import { readableAnalysisStatus, readableConcernLevel } from "@/lib/ai/format";
import { getLatestOwnedChatAnalysis } from "@/lib/ai/queries";
import { CHAT_PREVIEW_CHARACTERS } from "@/lib/chat/constants";
import { decryptChatContent } from "@/lib/chat/crypto";
import {
  formatSubmissionDate,
  readableSubmissionStatus,
} from "@/lib/chat/format";
import { getOwnedChatSubmission } from "@/lib/chat/queries";
import { getOwnedCase } from "@/lib/cases/queries";
import { requireChatEncryptionKey } from "@/lib/server-env";

import styles from "../../../../chat-pages.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Conversation Analysis" };

export default async function SavedChatSubmissionPage({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string; submissionId: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const user = await requireUser();
  const { caseId, submissionId } = await params;
  const query = await searchParams;
  const [caseRecord, submission, analysis] = await Promise.all([
    getOwnedCase(user.id, caseId),
    getOwnedChatSubmission(user.id, caseId, submissionId),
    getLatestOwnedChatAnalysis(user.id, caseId, submissionId),
  ]);

  if (!caseRecord || !submission) notFound();

  let savedText: string | null = null;
  let previewError: string | null = null;
  try {
    savedText = decryptChatContent(
      submission.content_ciphertext,
      submission.content_iv,
      requireChatEncryptionKey(),
    );
  } catch {
    previewError =
      "The encrypted text could not be opened with the current server key. The submission remains protected in storage.";
  }

  const preview = savedText?.slice(0, CHAT_PREVIEW_CHARACTERS) ?? null;
  const omitted = savedText
    ? Math.max(0, savedText.length - CHAT_PREVIEW_CHARACTERS)
    : 0;
  const completedAnalysis = analysis?.status === "completed";

  return (
    <PrivateShell email={user.email}>
      <div className={styles.headerRow}>
        <section className={styles.headerBlock}>
          <p className={styles.eyebrow}>Build 06 · AI Chat Analyzer</p>
          <h1>{caseRecord.private_nickname}</h1>
          <p className={styles.lead}>
            Review a server-side, evidence-based analysis of this saved
            conversation. The result is a preliminary concern indicator—not
            proof of identity, motive, criminality, authenticity, or safety.
          </p>
        </section>
        <Link className={styles.secondaryLink} href={`/cases/${caseId}/chat`}>
          Back to chat submissions
        </Link>
      </div>

      {query.message ? (
        <p className={styles.message} role="status">
          {query.message}
        </p>
      ) : null}

      <div className={styles.summaryGrid} aria-label="Submission summary">
        <article className={styles.summaryCard}>
          <strong>{submission.content_character_count.toLocaleString()}</strong>
          <span>Characters stored</span>
        </article>
        <article className={styles.summaryCard}>
          <strong>{readableSubmissionStatus(submission.status)}</strong>
          <span>Submission status</span>
        </article>
        <article className={styles.summaryCard}>
          <strong>
            {completedAnalysis
              ? readableConcernLevel(analysis.concern_level)
              : analysis
                ? readableAnalysisStatus(analysis.status)
                : "Not analyzed"}
          </strong>
          <span>Latest AI result</span>
        </article>
      </div>

      {analysis && analysis.status !== "completed" ? (
        <p className={styles.warning} role="status">
          Latest analysis status: {readableAnalysisStatus(analysis.status)}.
          {analysis.status === "failed"
            ? " The saved text remains encrypted and can be analyzed again."
            : " No assessment is displayed unless the structured result passes validation."}
        </p>
      ) : null}

      {analysis ? <ChatAnalysisResults analysis={analysis} /> : null}

      <AnalyzeConversationForm
        caseId={caseId}
        hasCompletedAnalysis={completedAnalysis}
        submissionId={submissionId}
      />

      <section className={styles.section} aria-labelledby="submission-details">
        <article className={styles.card}>
          <h2 id="submission-details">Submission details</h2>
          <dl className={styles.details}>
            <div>
              <dt>Saved</dt>
              <dd>{formatSubmissionDate(submission.created_at)}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>Pasted conversation text</dd>
            </div>
            <div>
              <dt>Encryption</dt>
              <dd>{submission.encryption_version}</dd>
            </div>
            <div>
              <dt>Consent version</dt>
              <dd>{submission.consent_version}</dd>
            </div>
          </dl>
        </article>
      </section>

      <details className={styles.previewDisclosure}>
        <summary>View a private preview of the saved text</summary>
        <p>
          The preview is decrypted only on the server for the signed-in case
          owner. Text is rendered as text—not executable HTML.
        </p>
        {previewError ? (
          <p className={styles.warning} role="alert">
            {previewError}
          </p>
        ) : preview ? (
          <>
            <SavedTextPreview text={preview} />
            {omitted ? (
              <p>
                Preview shortened by {omitted.toLocaleString()} characters. The
                complete encrypted submission remains stored.
              </p>
            ) : null}
          </>
        ) : (
          <p>No preview is available.</p>
        )}
      </details>

      <div className={styles.actions}>
        <Link className={styles.primaryLink} href={`/cases/${caseId}/chat`}>
          Add another submission
        </Link>
        <Link className={styles.secondaryLink} href={`/cases/${caseId}`}>
          Return to case overview
        </Link>
      </div>
    </PrivateShell>
  );
}
