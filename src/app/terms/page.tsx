import type { Metadata } from "next";

import { PublicPageShell } from "@/components/public-page-shell";

import styles from "../public-pages.module.css";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "Read the current TrueCheckDating.com terms and acceptable-use summary.",
};

export default function TermsPage() {
  return (
    <PublicPageShell>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Terms summary</p>
          <h1>Use TrueCheckDating.com for safer decisions—not accusations.</h1>
          <p className={styles.lead}>
            This page is a development-stage summary and not the final legal
            Terms of Service. Formal Terms require legal review before launch.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.bodyCopy}>
          <h2>Adult use</h2>
          <p>
            TrueCheckDating.com is intended for adults and must not be used to
            analyze minors.
          </p>

          <h2>Lawful material</h2>
          <p>
            Users must have a lawful reason to submit material and should
            include only information necessary for the private review.
          </p>

          <h2>Prohibited use</h2>
          <p>
            The service may not be used for stalking, harassment, threats,
            blackmail, doxxing, impersonation, unauthorized surveillance, or
            public accusations.
          </p>

          <h2>No proof or guarantee</h2>
          <p>
            Results are risk indicators and educational guidance. They do not
            prove fraud, criminality, legal identity, truthfulness, or safety.
          </p>

          <h2>User responsibility</h2>
          <p>
            Users remain responsible for their decisions. High-stakes financial,
            legal, immigration, or personal-safety situations may require help
            from qualified professionals, financial institutions, platforms, or
            law enforcement.
          </p>
        </div>
      </section>
    </PublicPageShell>
  );
}
