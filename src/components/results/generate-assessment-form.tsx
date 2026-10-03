"use client";

import { useActionState } from "react";

import { generatePreliminaryAssessmentAction } from "@/app/score-actions";
import {
  initialGenerateAssessmentActionState,
  type GenerateAssessmentActionState,
} from "@/lib/scoring/types";

import styles from "./preliminary-result.module.css";

export function GenerateAssessmentForm({
  caseId,
  disabled = false,
  label = "Calculate preliminary result",
}: {
  caseId: string;
  disabled?: boolean;
  label?: string;
}) {
  const [state, action, pending] = useActionState<
    GenerateAssessmentActionState,
    FormData
  >(generatePreliminaryAssessmentAction, initialGenerateAssessmentActionState);

  return (
    <form action={action} className={styles.generateForm}>
      <input name="caseId" type="hidden" value={caseId} />
      {state.status === "error" && state.message ? (
        <p className={styles.errorMessage} role="alert">
          {state.message}
        </p>
      ) : null}
      <button disabled={disabled || pending} type="submit">
        {pending ? "Calculating…" : label}
      </button>
      <p>
        The calculation uses deterministic application rules. It does not ask
        the AI to invent a final combined score.
      </p>
    </form>
  );
}
