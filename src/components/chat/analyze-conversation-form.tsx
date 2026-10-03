"use client";

import { useActionState } from "react";

import { analyzeChatSubmissionAction } from "@/app/analysis-actions";
import { initialChatAnalysisActionState } from "@/lib/ai/types";

import styles from "./chat-analysis.module.css";

export function AnalyzeConversationForm({
  caseId,
  submissionId,
  hasCompletedAnalysis,
}: {
  caseId: string;
  submissionId: string;
  hasCompletedAnalysis: boolean;
}) {
  const [state, action, pending] = useActionState(
    analyzeChatSubmissionAction,
    initialChatAnalysisActionState,
  );

  return (
    <form action={action} className={styles.analysisForm}>
      <input name="caseId" type="hidden" value={caseId} />
      <input name="submissionId" type="hidden" value={submissionId} />

      <div className={styles.analysisNotice}>
        <strong>
          {hasCompletedAnalysis
            ? "Run a fresh analysis"
            : "Analyze this saved conversation"}
        </strong>
        <p>
          The encrypted text is opened on the server and sent to OpenAI for a
          structured review. The result is a preliminary risk indicator—not
          proof of identity, intent, criminality, or safety.
        </p>
      </div>

      {state.status === "error" && state.message ? (
        <p className={styles.errorMessage} role="alert">
          {state.message}
        </p>
      ) : null}

      <button className={styles.analyzeButton} disabled={pending} type="submit">
        {pending
          ? "Analyzing securely…"
          : hasCompletedAnalysis
            ? "Analyze again"
            : "Analyze conversation"}
      </button>
      <p className={styles.processingHelp}>
        Keep this page open while the analysis runs. It may take up to about a
        minute. Your saved conversation remains encrypted if the AI request
        fails.
      </p>
    </form>
  );
}
