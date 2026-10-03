import { setAccountStatusAction } from "@/app/admin-actions";

import styles from "./admin.module.css";

export function AccountStatusForm({
  targetUserId,
  currentStatus,
}: {
  targetUserId: string;
  currentStatus: string;
}) {
  const nextStatus = currentStatus === "suspended" ? "active" : "suspended";

  return (
    <form action={setAccountStatusAction} className={styles.actionForm}>
      <input name="targetUserId" type="hidden" value={targetUserId} />
      <input name="nextStatus" type="hidden" value={nextStatus} />
      <label>
        Reason category
        <select defaultValue="support_review" name="reasonCode" required>
          <option value="support_review">Support review</option>
          <option value="abuse_prevention">Abuse prevention</option>
          <option value="billing_risk">Billing risk</option>
          <option value="owner_request">Owner request</option>
        </select>
      </label>
      <button className={styles.dangerButton} type="submit">
        {nextStatus === "suspended" ? "Suspend account" : "Restore account"}
      </button>
      <p>
        The action records the administrator, target account, prior status, new
        status, and reason category. It never stores a transcript or private
        note in the audit event.
      </p>
    </form>
  );
}
