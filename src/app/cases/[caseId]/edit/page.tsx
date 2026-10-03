import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CaseForm } from "@/components/cases/case-form";
import { PrivateShell } from "@/components/private/private-shell";
import { requireUser } from "@/lib/auth/user";
import { getOwnedCase } from "@/lib/cases/queries";

import styles from "../../../case-pages.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit Private Case" };

export default async function EditCasePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const user = await requireUser();
  const { caseId } = await params;
  const caseRecord = await getOwnedCase(user.id, caseId);
  if (!caseRecord) notFound();

  return (
    <PrivateShell email={user.email}>
      <section className={styles.headerBlock}>
        <p className={styles.eyebrow}>Edit private case</p>
        <h1>Update limited case details.</h1>
        <p className={styles.lead}>
          Keep identifying information to the minimum needed for your own
          review.
        </p>
      </section>
      <CaseForm initialCase={caseRecord} mode="edit" />
    </PrivateShell>
  );
}
