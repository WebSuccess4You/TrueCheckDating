"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";

import { saveProfileCheckAction } from "@/app/profile-actions";
import {
  PROFILE_NOTES_MAX_CHARACTERS,
  profileQuestions,
} from "@/lib/profile/constants";
import {
  initialProfileCheckActionState,
  type ProfileCheckRecord,
} from "@/lib/profile/types";

import styles from "./profile-check-form.module.css";

function FieldError({ errors, id }: { errors?: string[]; id: string }) {
  if (!errors?.length) return null;
  return (
    <p className={styles.error} id={id} role="alert">
      {errors[0]}
    </p>
  );
}

export function ProfileCheckForm({
  caseId,
  existingCheck,
}: {
  caseId: string;
  existingCheck: ProfileCheckRecord | null;
}) {
  const [state, action, pending] = useActionState(
    saveProfileCheckAction,
    initialProfileCheckActionState,
  );
  const [intent, setIntent] = useState<"save" | "complete">("save");
  const [notesLength, setNotesLength] = useState(
    existingCheck?.answers.notes?.length ?? 0,
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

      {profileQuestions.map((question) => {
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
        <label className={styles.legend} htmlFor="profile-notes">
          Optional notes
        </label>
        <p className={styles.help} id="profile-notes-help">
          Record the specific contradictions or clarifying details you observed.
          Avoid adding passwords, account numbers, addresses, or intimate
          content.
        </p>
        <textarea
          aria-describedby="profile-notes-help profile-notes-count profile-notes-error"
          aria-invalid={Boolean(state.fieldErrors?.notes)}
          className={styles.notes}
          defaultValue={savedAnswers.notes ?? ""}
          id="profile-notes"
          maxLength={PROFILE_NOTES_MAX_CHARACTERS}
          name="notes"
          onChange={(event) => setNotesLength(event.target.value.length)}
        />
        <p className={styles.characterCount} id="profile-notes-count">
          {notesLength}/{PROFILE_NOTES_MAX_CHARACTERS} characters
        </p>
        <FieldError
          errors={state.fieldErrors?.notes}
          id="profile-notes-error"
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
