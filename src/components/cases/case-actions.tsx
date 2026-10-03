"use client";

import { useState } from "react";

import { deleteCaseAction, setCaseStatusAction } from "@/app/case-actions";
import type { CaseStatus } from "@/lib/cases/types";

import styles from "./case-actions.module.css";

export function CaseActions({
  caseId,
  caseNickname,
  status,
  compact = false,
}: {
  caseId: string;
  caseNickname: string;
  status: CaseStatus;
  compact?: boolean;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const nextStatus = status === "archived" ? "active" : "archived";

  return (
    <div className={`${styles.actions} ${compact ? styles.compact : ""}`}>
      <form action={setCaseStatusAction}>
        <input name="caseId" type="hidden" value={caseId} />
        <input name="status" type="hidden" value={nextStatus} />
        <button className={styles.secondary} type="submit">
          {status === "archived" ? "Return to active" : "Archive"}
        </button>
      </form>

      {confirmingDelete ? (
        <div
          className={styles.confirmBox}
          role="group"
          aria-label={`Confirm deletion of ${caseNickname}`}
        >
          <p>
            Permanently delete <strong>{caseNickname}</strong>? This cannot be
            undone.
          </p>
          <div className={styles.confirmButtons}>
            <form action={deleteCaseAction}>
              <input name="caseId" type="hidden" value={caseId} />
              <button className={styles.danger} type="submit">
                Permanently delete
              </button>
            </form>
            <button
              className={styles.secondary}
              onClick={() => setConfirmingDelete(false)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          className={styles.dangerOutline}
          onClick={() => setConfirmingDelete(true)}
          type="button"
        >
          Delete
        </button>
      )}
    </div>
  );
}
