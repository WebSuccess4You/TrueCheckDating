import Link from "next/link";

import type { StaffRole } from "@/lib/admin/types";

import styles from "./admin.module.css";

export function AdminNav({ role }: { role: StaffRole }) {
  return (
    <nav aria-label="Administration sections" className={styles.adminNav}>
      <Link href="/admin">Overview</Link>
      <Link href="/admin/failures">Failures</Link>
      <Link href="/admin/support">Support lookup</Link>
      {role === "admin" ? <Link href="/admin/audit">Audit trail</Link> : null}
    </nav>
  );
}
