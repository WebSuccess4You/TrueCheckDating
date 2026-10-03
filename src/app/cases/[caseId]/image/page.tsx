import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ImageCheckForm } from "@/components/image/image-check-form";
import { ImageCheckResults } from "@/components/image/image-check-results";
import { PrivateShell } from "@/components/private/private-shell";
import { requireUser } from "@/lib/auth/user";
import { getOwnedCase } from "@/lib/cases/queries";
import { imageSearchServices } from "@/lib/image/constants";
import { getOwnedImageCheck } from "@/lib/image/queries";

import styles from "../../../chat-pages.module.css";
import imageStyles from "@/components/image/image-check.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Guided Reverse Image Checker" };

export default async function GuidedReverseImagePage({
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
  const imageCheck = await getOwnedImageCheck(user.id, caseId);

  return (
    <PrivateShell email={user.email}>
      <div className={styles.headerRow}>
        <section className={styles.headerBlock}>
          <p className={styles.eyebrow}>Guided Reverse Image Checker</p>
          <h1>{caseRecord.private_nickname}</h1>
          <p className={styles.lead}>
            Search a clear saved image with external tools, inspect the pages
            yourself, and privately record what you found. TrueCheckDating.com
            does not upload or automatically identify the person in Version 1.
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
          changing the reverse image check.
        </p>
      ) : null}

      <section className={styles.section} aria-labelledby="image-guide-heading">
        <div className={styles.sectionHeading}>
          <h2 id="image-guide-heading">How to run the check</h2>
          <p>Use at least two services when practical.</p>
        </div>
        <div className={styles.stepsGrid}>
          <article className={styles.stepCard}>
            <h2>1. Prepare a clear image</h2>
            <p>
              Save or crop a clear photo or screenshot. Avoid uploading intimate
              images or documents containing account numbers, addresses, or IDs.
            </p>
          </article>
          <article className={styles.stepCard}>
            <h2>2. Search more than once</h2>
            <p>
              Upload the image to two or more external services. Different
              services index different pages and may return different results.
            </p>
          </article>
          <article className={styles.stepCard}>
            <h2>3. Inspect exact sources</h2>
            <p>
              Look for exact or near-exact images, dates, names, and original
              pages. A visually similar face alone is not a reliable identity
              match.
            </p>
          </article>
          <article className={styles.stepCard}>
            <h2>4. Record without confronting</h2>
            <p>
              Save relevant page links and brief facts here. Do not contact or
              harass people found in search results.
            </p>
          </article>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="search-services">
        <div className={styles.sectionHeading}>
          <h2 id="search-services">External search services</h2>
          <p>
            These services open in a separate tab and have their own policies.
          </p>
        </div>
        <div className={styles.stepsGrid}>
          {imageSearchServices.map((service) => (
            <article className={styles.stepCard} key={service.name}>
              <h2>{service.name}</h2>
              <p>{service.description}</p>
              <div className={styles.actionBar}>
                <a
                  className={styles.primaryLink}
                  href={service.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open {service.name}
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <article className={imageStyles.safetyResult}>
        <h3>Important safety limitation</h3>
        <p>
          Search results can be incomplete, mislabeled, or unrelated. A match is
          a lead to inspect—not proof that the person communicating with you is
          fraudulent, criminal, genuine, or safe.
        </p>
      </article>

      {imageCheck ? <ImageCheckResults check={imageCheck} /> : null}

      <section className={styles.section} aria-labelledby="image-form-heading">
        <div className={styles.sectionHeading}>
          <h2 id="image-form-heading">
            {imageCheck ? "Update image check" : "Record image-check findings"}
          </h2>
          <p>
            Save progress at any time, or complete the check after choosing a
            result and accepting the safety statement.
          </p>
        </div>
        <ImageCheckForm caseId={caseRecord.id} existingCheck={imageCheck} />
      </section>
    </PrivateShell>
  );
}
