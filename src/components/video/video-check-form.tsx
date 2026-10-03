"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { saveVideoCheckAction } from "@/app/video-actions";
import {
  VIDEO_NOTES_MAX_CHARACTERS,
  videoQuestions,
} from "@/lib/video/constants";
import {
  initialVideoCheckActionState,
  type VideoCheckRecord,
} from "@/lib/video/types";

import styles from "./video-check.module.css";

function FieldError({ errors, id }: { errors?: string[]; id: string }) {
  if (!errors?.length) return null;
  return (
    <p className={styles.error} id={id} role="alert">
      {errors[0]}
    </p>
  );
}

export function VideoCheckForm({
  caseId,
  existingCheck,
}: {
  caseId: string;
  existingCheck: VideoCheckRecord | null;
}) {
  const [state, action, pending] = useActionState(
    saveVideoCheckAction,
    initialVideoCheckActionState,
  );
  const [intent, setIntent] = useState<"save" | "complete">("save");
  const [notesLength, setNotesLength] = useState(
    existingCheck?.notes?.length ?? 0,
  );
  const savedAnswers = useMemo(
    () => existingCheck?.answers ?? {},
    [existingCheck],
  );

  return (
    <form action={action} className={styles.form} noValidate>
      <input name="caseId" type="hidden" value={caseId} />
      <input name="intent" type="hidden" value={intent} />

      {state.status === "error" && state.message ? (
        <div className={styles.statusError} role="alert">
          {state.message}
        </div>
      ) : null}

      {videoQuestions.map((question) => {
        const errorId = `${question.key}-error`;
        const helpId = `${question.key}-help`;
        return (
          <fieldset className={styles.question} key={question.key}>
            <legend className={styles.legend}>{question.label}</legend>
            <p className={styles.help} id={helpId}>
              {question.help}
            </p>
            <div className={styles.optionList}>
              {question.options.map((option) => (
                <label className={styles.option} key={option.value}>
                  <input
                    aria-describedby={`${helpId} ${errorId}`}
                    defaultChecked={savedAnswers[question.key] === option.value}
                    name={question.key}
                    type="radio"
                    value={option.value}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            <FieldError
              errors={state.fieldErrors?.[question.key]}
              id={errorId}
            />
          </fieldset>
        );
      })}

      <div className={styles.question}>
        <label className={styles.legend} htmlFor="video-notes">
          Optional private notes
        </label>
        <p className={styles.help} id="video-notes-help">
          Record specific dates, excuses, observations, or live actions. Do not
          add passwords, account numbers, addresses, intimate content, or secret
          recordings.
        </p>
        <textarea
          aria-describedby="video-notes-help video-notes-count video-notes-error"
          aria-invalid={Boolean(state.fieldErrors?.notes)}
          className={styles.notes}
          defaultValue={existingCheck?.notes ?? ""}
          id="video-notes"
          maxLength={VIDEO_NOTES_MAX_CHARACTERS}
          name="notes"
          onChange={(event) => setNotesLength(event.target.value.length)}
        />
        <p className={styles.characterCount} id="video-notes-count">
          {notesLength}/{VIDEO_NOTES_MAX_CHARACTERS} characters
        </p>
        <FieldError errors={state.fieldErrors?.notes} id="video-notes-error" />
      </div>

      <div className={styles.safetyBox}>
        <label className={styles.checkbox}>
          <input
            aria-describedby="safetyAcknowledged-error"
            defaultChecked={Boolean(existingCheck?.safety_acknowledged_at)}
            name="safetyAcknowledged"
            type="checkbox"
          />
          <span>
            I understand that this checklist records my observations and does
            not prove identity, intent, criminality, genuineness, or safety. I
            will not secretly record anyone or violate applicable consent and
            recording laws.
          </span>
        </label>
        <FieldError
          errors={state.fieldErrors?.safetyAcknowledged}
          id="safetyAcknowledged-error"
        />
      </div>

      <div className={styles.actions}>
        <button
          className={styles.submit}
          disabled={pending}
          onClick={() => setIntent("save")}
          type="submit"
        >
          {pending && intent === "save" ? "Saving…" : "Save progress"}
        </button>
        <button
          className={styles.secondaryAction}
          disabled={pending}
          onClick={() => setIntent("complete")}
          type="submit"
        >
          {pending && intent === "complete" ? "Completing…" : "Complete check"}
        </button>
        <Link className={styles.secondaryAction} href={`/cases/${caseId}`}>
          Return to case
        </Link>
      </div>
    </form>
  );
}
