import Link from "next/link";
import type { ReactNode } from "react";

import type { StaffRole } from "@/lib/admin/types";

import { logoutAction } from "@/app/auth-actions";

import styles from "./private-shell.module.css";

export function PrivateShell({
  children,
  email,
  role,
}: {
  children: ReactNode;
  email?: string;
  role?: StaffRole;
}) {
  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#private-main">
        Skip to main content
      </a>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} href="/dashboard">
            TrueCheckDating.com
          </Link>
          <nav aria-label="Private account navigation" className={styles.nav}>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/cases/new">New case</Link>
            <Link href="/account">Account</Link>
            {role ? <Link href="/admin">Administration</Link> : null}
            {email ? <span className={styles.userLine}>{email}</span> : null}
            <form action={logoutAction}>
              <button className={styles.logout} type="submit">
                Log out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className={styles.main} id="private-main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
