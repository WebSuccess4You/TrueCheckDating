import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PrivateShell } from "@/components/private/private-shell";
import { VideoCheckForm } from "@/components/video/video-check-form";
import { VideoCheckResults } from "@/components/video/video-check-results";
import { requireUser } from "@/lib/auth/user";
import { getOwnedCase } from "@/lib/cases/queries";
import { getOwnedVideoCheck } from "@/lib/video/queries";

import styles from "../../../chat-pages.module.css";
import videoStyles from "@/components/video/video-check.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Video Call Verifier" };

export default async function VideoCallVerifierPage({
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
  const videoCheck = await getOwnedVideoCheck(user.id, caseId);

  return (
    <PrivateShell email={user.email}>
      <div className={styles.headerRow}>
        <section className={styles.headerBlock}>
          <p className={styles.eyebrow}>Video Call Verifier</p>
          <h1>{caseRecord.private_nickname}</h1>
          <p className={styles.lead}>
            Record what happened during normal live-video requests. This
            checklist does not watch, record, identify, or independently verify
            another person.
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
          changing the video check.
        </p>
      ) : null}

      <section className={styles.section} aria-labelledby="video-guide-heading">
        <div className={styles.sectionHeading}>
          <h2 id="video-guide-heading">Safer live verification</h2>
          <p>Keep requests simple, respectful, and lawful.</p>
        </div>
        <div className={styles.stepsGrid}>
          <article className={styles.stepCard}>
            <h2>1. Request a normal conversation</h2>
            <p>
              Ask for a mutually agreed live call at a reasonable time. Avoid
              surprise demands, humiliation, or elaborate tests.
            </p>
          </article>
          <article className={styles.stepCard}>
            <h2>2. Observe natural interaction</h2>
            <p>
              Notice whether speech, movement, surroundings, and responses fit a
              live conversation. Poor internet alone is not proof of deception.
            </p>
          </article>
          <article className={styles.stepCard}>
            <h2>3. Use one simple live action</h2>
            <p>
              A respectful request such as waving, turning toward a window, or
              mentioning today’s agreed topic can help distinguish live from
              prerecorded material.
            </p>
          </article>
          <article className={styles.stepCard}>
            <h2>4. Pause when pressured</h2>
            <p>
              Do not send money, travel, or share sensitive information because
              someone becomes urgent, angry, guilty, or threatening.
            </p>
          </article>
        </div>
      </section>

      <article className={videoStyles.safetyResult}>
        <h3>No secret recording</h3>
        <p>
          Recording laws and consent rules vary. TrueCheckDating.com does not
          provide a recording feature. Use this checklist to record your
          observations, not another person’s audio or video.
        </p>
      </article>

      {videoCheck ? <VideoCheckResults check={videoCheck} /> : null}

      <section className={styles.section} aria-labelledby="video-form-heading">
        <div className={styles.sectionHeading}>
          <h2 id="video-form-heading">
            {videoCheck
              ? "Update video-call check"
              : "Record video-call findings"}
          </h2>
          <p>
            Save progress at any time. To complete the check, answer every item
            or choose the available unknown option.
          </p>
        </div>
        <VideoCheckForm caseId={caseRecord.id} existingCheck={videoCheck} />
      </section>
    </PrivateShell>
  );
}
