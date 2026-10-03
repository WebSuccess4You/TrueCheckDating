import type { Metadata } from "next";

import { CaseForm } from "@/components/cases/case-form";
import { PrivateShell } from "@/components/private/private-shell";
import { requireUser } from "@/lib/auth/user";

import styles from "../../case-pages.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Create Private Case" };

export default async function NewCasePage() {
  const user = await requireUser();

  return (
    <PrivateShell email={user.email}>
      <section className={styles.headerBlock}>
        <p className={styles.eyebrow}>New private case</p>
        <h1>Create a case without oversharing.</h1>
        <p className={styles.lead}>
          Start with a private nickname and only the details needed to organize
          the review. Conversation submission begins in Build 05.
        </p>
      </section>
      <CaseForm mode="create" />
    </PrivateShell>
  );
}
