import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ChatSubmissionForm } from "@/components/chat/chat-submission-form";
import { PrivateShell } from "@/components/private/private-shell";
import { requireUser } from "@/lib/auth/user";
import {
  formatSubmissionDate,
  readableSubmissionStatus,
} from "@/lib/chat/format";
import { listOwnedChatSubmissions } from "@/lib/chat/queries";
import { getOwnedCase } from "@/lib/cases/queries";

import styles from "../../../chat-pages.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Chat Submission" };

export default async function ChatSubmissionPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const user = await requireUser();
  const { caseId } = await params;
  const caseRecord = await getOwnedCase(user.id, caseId);
  if (!caseRecord) notFound();

  const submissions = await listOwnedChatSubmissions(user.id, caseId);

  return (
    <PrivateShell email={user.email}>
      <div className={styles.headerRow}>
        <section className={styles.headerBlock}>
          <p className={styles.eyebrow}>Build 06 · Private chat analysis</p>
          <h1>Save conversation text for {caseRecord.private_nickname}.</h1>
          <p className={styles.lead}>
            Paste and encrypt conversation text, then open a saved submission to
            run the server-side AI Chat Analyzer.
          </p>
        </section>
        <Link className={styles.secondaryLink} href={`/cases/${caseId}`}>
          Back to case
        </Link>
      </div>

      {caseRecord.status === "archived" ? (
        <p className={styles.warning} role="alert">
          This case is archived. Restore it from the dashboard before adding a
          new conversation submission.
        </p>
      ) : (
        <ChatSubmissionForm
          caseId={caseRecord.id}
          caseNickname={caseRecord.private_nickname}
        />
      )}

      <section className={styles.section} aria-labelledby="saved-submissions">
        <div className={styles.sectionHeading}>
          <h2 id="saved-submissions">Saved submissions</h2>
          <p>{submissions.length} stored</p>
        </div>

        {submissions.length ? (
          <div className={styles.historyList}>
            {submissions.map((submission, index) => (
              <article className={styles.card} key={submission.id}>
                <div className={styles.cardRow}>
                  <div>
                    <h2>
                      Conversation submission {submissions.length - index}
                    </h2>
                    <p className={styles.meta}>
                      {submission.content_character_count.toLocaleString()}{" "}
                      characters · {formatSubmissionDate(submission.created_at)}
                    </p>
                  </div>
                  <span className={styles.statusPill}>
                    {readableSubmissionStatus(submission.status)}
                  </span>
                </div>
                <div className={styles.actions}>
                  <Link
                    className={styles.secondaryLink}
                    href={`/cases/${caseId}/chat/${submission.id}`}
                  >
                    View saved submission
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <article className={styles.card}>
            <h2>No conversation text saved yet</h2>
            <p>
              Your first encrypted submission will appear here after it is
              validated and stored.
            </p>
          </article>
        )}
      </section>
    </PrivateShell>
  );
}
