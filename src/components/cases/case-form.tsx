"use client";

import Link from "next/link";
import { useActionState } from "react";

import { createCaseAction, updateCaseAction } from "@/app/case-actions";
import { initialCaseActionState, type CaseRecord } from "@/lib/cases/types";

import styles from "./case-form.module.css";

function FieldError({ errors, id }: { errors?: string[]; id: string }) {
  if (!errors?.length) return null;
  return (
    <p className={styles.error} id={id} role="alert">
      {errors[0]}
    </p>
  );
}

export function CaseForm({
  mode,
  initialCase,
}: {
  mode: "create" | "edit";
  initialCase?: CaseRecord;
}) {
  const actionFunction =
    mode === "create" ? createCaseAction : updateCaseAction;
  const [state, action, pending] = useActionState(
    actionFunction,
    initialCaseActionState,
  );

  const backHref = initialCase ? `/cases/${initialCase.id}` : "/dashboard";

  return (
    <form action={action} className={styles.form} noValidate>
      {initialCase ? (
        <input name="caseId" type="hidden" value={initialCase.id} />
      ) : null}

      {state.status === "error" && state.message ? (
        <div className={styles.statusError} role="alert">
          {state.message}
        </div>
      ) : null}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="private-nickname">
          Private case nickname <span aria-hidden="true">*</span>
        </label>
        <input
          aria-describedby="private-nickname-help private-nickname-error"
          aria-invalid={Boolean(state.fieldErrors?.privateNickname)}
          autoComplete="off"
          className={styles.input}
          defaultValue={initialCase?.private_nickname ?? ""}
          id="private-nickname"
          maxLength={80}
          name="privateNickname"
          required
          type="text"
        />
        <p className={styles.help} id="private-nickname-help">
          Use a name only you will recognize, such as “Summer contact.” A real
          name is not required.
        </p>
        <FieldError
          errors={state.fieldErrors?.privateNickname}
          id="private-nickname-error"
        />
      </div>

      <div className={styles.twoColumn}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="communication-platform">
            Dating app or communication platform
          </label>
          <input
            aria-describedby="communication-platform-error"
            aria-invalid={Boolean(state.fieldErrors?.communicationPlatform)}
            autoComplete="off"
            className={styles.input}
            defaultValue={initialCase?.communication_platform ?? ""}
            id="communication-platform"
            maxLength={80}
            name="communicationPlatform"
            placeholder="Example: Facebook Dating"
            type="text"
          />
          <FieldError
            errors={state.fieldErrors?.communicationPlatform}
            id="communication-platform-error"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="communication-started-on">
            Approximate date communication began
          </label>
          <input
            aria-describedby="communication-started-on-error"
            aria-invalid={Boolean(state.fieldErrors?.communicationStartedOn)}
            className={styles.input}
            defaultValue={initialCase?.communication_started_on ?? ""}
            id="communication-started-on"
            max={new Date().toISOString().slice(0, 10)}
            name="communicationStartedOn"
            type="date"
          />
          <FieldError
            errors={state.fieldErrors?.communicationStartedOn}
            id="communication-started-on-error"
          />
        </div>
      </div>

      <div className={styles.twoColumn}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="claimed-name">
            Claimed first name or alias
          </label>
          <input
            aria-describedby="claimed-name-help claimed-name-error"
            aria-invalid={Boolean(state.fieldErrors?.claimedNameOrAlias)}
            autoComplete="off"
            className={styles.input}
            defaultValue={initialCase?.claimed_name_or_alias ?? ""}
            id="claimed-name"
            maxLength={100}
            name="claimedNameOrAlias"
            type="text"
          />
          <p className={styles.help} id="claimed-name-help">
            Optional. Avoid entering a full legal name unless necessary.
          </p>
          <FieldError
            errors={state.fieldErrors?.claimedNameOrAlias}
            id="claimed-name-error"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="claimed-location">
            Claimed city, state, or country
          </label>
          <input
            aria-describedby="claimed-location-error"
            aria-invalid={Boolean(state.fieldErrors?.claimedLocation)}
            autoComplete="off"
            className={styles.input}
            defaultValue={initialCase?.claimed_location ?? ""}
            id="claimed-location"
            maxLength={120}
            name="claimedLocation"
            type="text"
          />
          <FieldError
            errors={state.fieldErrors?.claimedLocation}
            id="claimed-location-error"
          />
        </div>
      </div>

      {mode === "create" ? (
        <div className={styles.acknowledgement}>
          <label className={styles.checkboxLabel}>
            <input name="lawfulUseAcknowledged" required type="checkbox" />
            <span>
              I am creating this case for a lawful personal-safety purpose. I
              will not use TrueCheckDating.com to stalk, threaten, harass, dox,
              or publicly accuse another person.
            </span>
          </label>
          <FieldError
            errors={state.fieldErrors?.lawfulUseAcknowledged}
            id="lawful-use-error"
          />
        </div>
      ) : null}

      <div className={styles.actions}>
        <button className={styles.submit} disabled={pending} type="submit">
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Create private case"
              : "Save case details"}
        </button>
        <Link className={styles.cancel} href={backHref}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
