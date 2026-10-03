"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { createChatSubmissionAction } from "@/app/chat-actions";
import { CHAT_MAX_CHARACTERS, CHAT_MIN_CHARACTERS } from "@/lib/chat/constants";
import { initialChatSubmissionActionState } from "@/lib/chat/types";

import styles from "./chat-submission.module.css";

function FieldError({ errors, id }: { errors?: string[]; id: string }) {
  if (!errors?.length) return null;
  return (
    <p className={styles.error} id={id} role="alert">
      {errors[0]}
    </p>
  );
}

export function ChatSubmissionForm({
  caseId,
  caseNickname,
}: {
  caseId: string;
  caseNickname: string;
}) {
  const [conversationText, setConversationText] = useState("");
  const [state, action, pending] = useActionState(
    createChatSubmissionAction,
    initialChatSubmissionActionState,
  );
  const remaining = CHAT_MAX_CHARACTERS - conversationText.length;
  const hasEnoughContext =
    conversationText.trim().length >= CHAT_MIN_CHARACTERS;

  return (
    <form action={action} className={styles.form} noValidate>
      <input name="caseId" type="hidden" value={caseId} />

      {state.status === "error" && state.message ? (
        <div className={styles.statusError} role="alert">
          {state.message}
        </div>
      ) : null}

      <div className={styles.privacyNotice}>
        <strong>Before you paste a conversation</strong>
        <p>
          Remove passwords, account numbers, street addresses, intimate
          material, and unrelated private details. Use only material you have a
          lawful reason to review.
        </p>
      </div>

      <div className={styles.field}>
        <div className={styles.labelRow}>
          <label className={styles.label} htmlFor="conversation-text">
            Conversation text <span aria-hidden="true">*</span>
          </label>
          <span
            className={remaining < 0 ? styles.counterError : styles.counter}
            id="conversation-counter"
          >
            {conversationText.length.toLocaleString()} /{" "}
            {CHAT_MAX_CHARACTERS.toLocaleString()}
          </span>
        </div>
        <textarea
          aria-describedby="conversation-help conversation-counter conversation-error"
          aria-invalid={Boolean(state.fieldErrors?.conversationText)}
          className={styles.textarea}
          id="conversation-text"
          maxLength={CHAT_MAX_CHARACTERS}
          name="conversationText"
          onChange={(event) => setConversationText(event.target.value)}
          placeholder={
            "Example:\nMe: Are we still having a video call tonight?\nContact: My camera stopped working again..."
          }
          required
          rows={16}
          value={conversationText}
        />
        <p className={styles.help} id="conversation-help">
          Paste at least {CHAT_MIN_CHARACTERS} characters. Speaker labels such
          as “Me:” and “Contact:” help preserve context. The text is encrypted
          on the server before storage.
        </p>
        {!hasEnoughContext && conversationText.length > 0 ? (
          <p className={styles.contextHint} role="status">
            Add at least{" "}
            {Math.max(0, CHAT_MIN_CHARACTERS - conversationText.trim().length)}{" "}
            more characters for enough context.
          </p>
        ) : null}
        <FieldError
          errors={state.fieldErrors?.conversationText}
          id="conversation-error"
        />
      </div>

      <fieldset className={styles.consentGroup}>
        <legend>Required confirmations</legend>
        <label className={styles.checkboxLabel}>
          <input name="sensitiveDataReviewed" required type="checkbox" />
          <span>
            I reviewed this text and removed unnecessary passwords, financial
            account numbers, precise addresses, and intimate material.
          </span>
        </label>
        <FieldError
          errors={state.fieldErrors?.sensitiveDataReviewed}
          id="sensitive-data-error"
        />

        <label className={styles.checkboxLabel}>
          <input
            name="processingConsentAcknowledged"
            required
            type="checkbox"
          />
          <span>
            I understand this submission will be stored privately and may be
            processed by the TrueCheckDating.com analyzer when I choose “Analyze
            conversation.”
          </span>
        </label>
        <FieldError
          errors={state.fieldErrors?.processingConsentAcknowledged}
          id="processing-consent-error"
        />
      </fieldset>

      <div className={styles.actions}>
        <button
          className={styles.submit}
          disabled={pending || !hasEnoughContext}
          type="submit"
        >
          {pending ? "Encrypting and saving…" : "Save conversation privately"}
        </button>
        <Link className={styles.cancel} href={`/cases/${caseId}`}>
          Return to {caseNickname}
        </Link>
      </div>
    </form>
  );
}
