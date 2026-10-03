"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { saveImageCheckAction } from "@/app/image-actions";
import {
  IMAGE_NOTES_MAX_CHARACTERS,
  IMAGE_SOURCE_LINK_LIMIT,
  imageResultOptions,
} from "@/lib/image/constants";
import {
  initialImageCheckActionState,
  type ImageCheckRecord,
} from "@/lib/image/types";

import styles from "./image-check.module.css";

function FieldError({ errors, id }: { errors?: string[]; id: string }) {
  if (!errors?.length) return null;
  return (
    <p className={styles.error} id={id} role="alert">
      {errors[0]}
    </p>
  );
}

export function ImageCheckForm({
  caseId,
  existingCheck,
}: {
  caseId: string;
  existingCheck: ImageCheckRecord | null;
}) {
  const [state, action, pending] = useActionState(
    saveImageCheckAction,
    initialImageCheckActionState,
  );
  const [intent, setIntent] = useState<"save" | "complete" | "unavailable">(
    "save",
  );
  const [notesLength, setNotesLength] = useState(
    existingCheck?.notes?.length ?? 0,
  );

  return (
    <form action={action} className={styles.form} noValidate>
      <input name="caseId" type="hidden" value={caseId} />

      {state.status === "error" && state.message ? (
        <div className={styles.statusError} role="alert">
          {state.message}
        </div>
      ) : null}

      <fieldset className={styles.question}>
        <legend className={styles.legend}>What did the searches show?</legend>
        <p className={styles.help} id="result-category-help">
          Choose the closest result. A search result is a clue and must be
          inspected independently; it is not proof of identity or intent. If no
          image was available or no search was performed, use the button below.
          Inconclusive findings are saved without affecting the score.
        </p>
        <div className={styles.optionList}>
          {imageResultOptions.map((option) => (
            <label className={styles.option} key={option.value}>
              <input
                aria-describedby="result-category-help resultCategory-error"
                defaultChecked={existingCheck?.result_category === option.value}
                name="resultCategory"
                type="radio"
                value={option.value}
              />
              <span>
                <strong>{option.label}</strong>
                <small>{option.help}</small>
              </span>
            </label>
          ))}
        </div>
        <FieldError
          errors={state.fieldErrors?.resultCategory}
          id="resultCategory-error"
        />
      </fieldset>

      <section
        className={styles.question}
        aria-labelledby="source-links-heading"
      >
        <h2 className={styles.legend} id="source-links-heading">
          Optional source links
        </h2>
        <p className={styles.help}>
          Record up to {IMAGE_SOURCE_LINK_LIMIT} pages that support what you
          found. TrueCheckDating.com stores these privately but does not
          independently verify or endorse them.
        </p>
        <div className={styles.linkFields}>
          {Array.from({ length: IMAGE_SOURCE_LINK_LIMIT }, (_, index) => {
            const fieldName = `sourceLink${index + 1}`;
            const errorId = `${fieldName}-error`;
            return (
              <div className={styles.linkField} key={fieldName}>
                <label htmlFor={fieldName}>Source link {index + 1}</label>
                <input
                  aria-describedby={errorId}
                  aria-invalid={Boolean(state.fieldErrors?.[fieldName])}
                  defaultValue={existingCheck?.source_links[index] ?? ""}
                  id={fieldName}
                  inputMode="url"
                  name={fieldName}
                  placeholder="https://example.com/page"
                  type="url"
                />
                <FieldError
                  errors={state.fieldErrors?.[fieldName]}
                  id={errorId}
                />
              </div>
            );
          })}
        </div>
      </section>

      <div className={styles.question}>
        <label className={styles.legend} htmlFor="image-notes">
          Optional private notes
        </label>
        <p className={styles.help} id="image-notes-help">
          Record the exact name, date, website, or reason the result appeared
          relevant. Avoid addresses, account numbers, passwords, or intimate
          information.
        </p>
        <textarea
          aria-describedby="image-notes-help image-notes-count image-notes-error"
          aria-invalid={Boolean(state.fieldErrors?.notes)}
          className={styles.notes}
          defaultValue={existingCheck?.notes ?? ""}
          id="image-notes"
          maxLength={IMAGE_NOTES_MAX_CHARACTERS}
          name="notes"
          onChange={(event) => setNotesLength(event.target.value.length)}
        />
        <p className={styles.characterCount} id="image-notes-count">
          {notesLength}/{IMAGE_NOTES_MAX_CHARACTERS} characters
        </p>
        <FieldError errors={state.fieldErrors?.notes} id="image-notes-error" />
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
            I understand that reverse-image results are clues, not proof. I will
            not contact, threaten, harass, dox, or publicly accuse anyone based
            on these results.
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
          name="intent"
          type="submit"
          value="save"
        >
          {pending && intent === "save" ? "Saving…" : "Save progress"}
        </button>
        <button
          className={styles.secondaryAction}
          disabled={pending}
          onClick={() => setIntent("complete")}
          name="intent"
          type="submit"
          value="complete"
        >
          {pending && intent === "complete" ? "Completing…" : "Complete check"}
        </button>
        <button
          className={styles.secondaryAction}
          disabled={pending}
          name="intent"
          onClick={() => setIntent("unavailable")}
          type="submit"
          value="unavailable"
        >
          {pending && intent === "unavailable"
            ? "Saving…"
            : "No image available / not searched"}
        </button>
        <Link className={styles.secondaryAction} href={`/cases/${caseId}`}>
          Return to case
        </Link>
      </div>
    </form>
  );
}
