import type { Metadata } from "next";

import { PublicPageShell } from "@/components/public-page-shell";
import { ButtonLink } from "@/components/ui/button-link";

import styles from "../public-pages.module.css";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "See how TrueCheckDating.com organizes conversation patterns, profile claims, image-search findings, and video verification into one private report.",
};

const steps = [
  {
    title: "Create a private case",
    description:
      "Use a nickname instead of a real name when possible. Include only the information needed to understand your concern.",
  },
  {
    title: "Analyze the conversation",
    description:
      "Paste relevant messages. The analyzer looks for pressure, urgency, manipulation, financial requests, and verification behavior.",
  },
  {
    title: "Complete guided checks",
    description:
      "Organize profile claims, record reverse-image-search findings, and evaluate live video-call behavior.",
  },
  {
    title: "Read the combined report",
    description:
      "Review concern level, confidence, evidence completeness, warning signs, protective signals, and practical next steps.",
  },
];

export default function HowItWorksPage() {
  return (
    <PublicPageShell>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>How TrueCheckDating.com works</p>
          <h1>One structured review instead of scattered clues.</h1>
          <p className={styles.lead}>
            TrueCheckDating.com helps ordinary users organize the information
            they already have. It does not secretly investigate, monitor, or
            prove anyone’s identity.
          </p>
          <div className={styles.ctaRow}>
            <ButtonLink href="/signup">Start a private check</ButtonLink>
            <ButtonLink href="/pricing" variant="secondary">
              View pricing
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.gridTwo}>
          {steps.map((step, index) => (
            <article className={styles.card} key={step.title}>
              <span className={styles.number}>{index + 1}</span>
              <h2>{step.title}</h2>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.bodyCopy}>
          <h2>What the analysis can help you notice</h2>
          <ul>
            <li>Repeated financial pressure or manufactured urgency</li>
            <li>Contradictory claims about age, location, work, or family</li>
            <li>Repeated avoidance of ordinary live verification</li>
            <li>Images connected to other identities or unrelated profiles</li>
            <li>Pressure to keep the relationship or transaction secret</li>
            <li>Protective signals that reduce concern</li>
          </ul>

          <h2>What it cannot prove</h2>
          <p>
            Text, profile information, and user-reported search results cannot
            establish legal identity, criminal intent, or personal safety.
            TrueCheckDating.com therefore shows confidence, evidence
            completeness, and limitations beside the concern score.
          </p>

          <h2>What happens after the report</h2>
          <p>
            The report recommends proportionate next steps, such as pausing a
            transfer, requesting an ordinary live call, independently checking a
            claim, preserving records, or asking a trusted person for a second
            opinion.
          </p>
        </div>
      </section>
    </PublicPageShell>
  );
}
