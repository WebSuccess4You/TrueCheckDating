import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProfileCheckForm } from "@/components/profile/profile-check-form";
import { ProfileCheckResults } from "@/components/profile/profile-check-results";
import { PrivateShell } from "@/components/private/private-shell";
import { requireUser } from "@/lib/auth/user";
import { getOwnedCase } from "@/lib/cases/queries";
import { getOwnedProfileCheck } from "@/lib/profile/queries";

import styles from "../../../chat-pages.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Profile Consistency Check" };

export default async function ProfileConsistencyPage({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const user = await requireUser();
  const { caseId } = await params;
  const query = await searchParams;
  const caseRecord = await getOwnedCase(user.id, caseId);
  if (!caseRecord) notFound();
  const profileCheck = await getOwnedProfileCheck(user.id, caseId);

  return (
    <PrivateShell email={user.email}>
      <div className={styles.headerRow}>
        <section className={styles.headerBlock}>
          <p className={styles.eyebrow}>Profile Consistency Check</p>
          <h1>{caseRecord.private_nickname}</h1>
          <p className={styles.lead}>
            Compare the person’s claims about name, age, location, work, family,
            timeline, social history, money requests, and verification
            cooperation. This is a structured risk indicator, not proof.
          </p>
        </section>
        <Link className={styles.secondaryLink} href={`/cases/${caseRecord.id}`}>
          Back to case overview
        </Link>
      </div>

      {query.message ? (
        <p className={styles.message} role="status">
          {query.message}
        </p>
      ) : null}

      {caseRecord.status !== "active" ? (
        <p className={styles.warning} role="alert">
          This case is archived. Restore it from the case overview before
          changing the profile check.
        </p>
      ) : null}

      <section className={styles.section} aria-labelledby="profile-context">
        <div className={styles.sectionHeading}>
          <h2 id="profile-context">What to record</h2>
          <p>Use “Unknown” when you do not have enough information.</p>
        </div>
        <article className={styles.placeholder}>
          <span className={styles.placeholderLabel}>Privacy reminder</span>
          <h2>Keep notes specific and minimal</h2>
          <p>
            Record the facts that affect consistency. Do not add passwords, bank
            details, addresses, or intimate content. Missing information lowers
            evidence completeness instead of automatically increasing risk.
          </p>
        </article>
      </section>

      {profileCheck ? <ProfileCheckResults check={profileCheck} /> : null}

      <section
        className={styles.section}
        aria-labelledby="profile-form-heading"
      >
        <div className={styles.sectionHeading}>
          <h2 id="profile-form-heading">
            {profileCheck ? "Update profile check" : "Start profile check"}
          </h2>
          <p>
            Save progress at any time, or complete the check after every
            question has an answer.
          </p>
        </div>
        <ProfileCheckForm caseId={caseRecord.id} existingCheck={profileCheck} />
      </section>
    </PrivateShell>
  );
}
