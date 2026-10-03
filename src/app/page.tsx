import {
  ArrowRightIcon,
  CheckIcon,
  ImageSearchIcon,
  LockIcon,
  MessageSearchIcon,
  ProfileIcon,
  ReportIcon,
  ShieldCheckIcon,
  VideoCheckIcon,
} from "@/components/icons";
import { PublicPageShell } from "@/components/public-page-shell";
import { SectionHeading } from "@/components/section-heading";
import { ButtonLink } from "@/components/ui/button-link";

import styles from "./page.module.css";

const features = [
  {
    icon: MessageSearchIcon,
    title: "AI Chat Analyzer",
    description:
      "Review conversation patterns for financial pressure, urgency, manipulation, and verification behavior.",
  },
  {
    icon: ProfileIcon,
    title: "Profile Consistency Check",
    description:
      "Organize claims about age, location, work, family, and timelines so contradictions are easier to see.",
  },
  {
    icon: ImageSearchIcon,
    title: "Guided Image Check",
    description:
      "Follow a safe reverse-image-search process and record what the results may—and may not—show.",
  },
  {
    icon: VideoCheckIcon,
    title: "Video Call Verifier",
    description:
      "Evaluate repeated avoidance, live interaction, and simple verification requests without secret recording.",
  },
];

const reportItems = [
  "Overall concern level",
  "Risk score with confidence",
  "Evidence completeness",
  "Warning and protective signals",
  "Practical next steps",
  "Clear limitations",
];

export default function Home() {
  return (
    <PublicPageShell>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <ShieldCheckIcon /> Private online-dating safety review
            </p>
            <h1>Pause before money, travel, or a major commitment.</h1>
            <p className={styles.heroText}>
              TrueCheckDating.com helps you review conversations, profile
              claims, image-search findings, and verification behavior for
              warning signs—without publicly accusing anyone.
            </p>
            <div className={styles.heroActions}>
              <ButtonLink href="/signup" size="large">
                Start a private check <ArrowRightIcon />
              </ButtonLink>
              <ButtonLink href="/how-it-works" size="large" variant="secondary">
                See how it works
              </ButtonLink>
            </div>
            <div className={styles.heroTrust} aria-label="Product principles">
              <span>
                <LockIcon /> Private cases
              </span>
              <span>
                <CheckIcon /> Evidence separated from inference
              </span>
            </div>
          </div>

          <div
            className={styles.preview}
            aria-label="Illustrative report preview"
          >
            <div className={styles.previewTop}>
              <div>
                <p className={styles.previewLabel}>Illustrative report</p>
                <p className={styles.previewName}>Case: Summer Connection</p>
              </div>
              <span className={styles.previewStatus}>Example only</span>
            </div>
            <div className={styles.scoreRow}>
              <div
                className={styles.scoreRing}
                aria-label="Example risk score 68 out of 100"
              >
                <strong>68</strong>
                <span>/100</span>
              </div>
              <div>
                <p className={styles.concern}>High concern</p>
                <p className={styles.confidence}>
                  Moderate confidence · 64% complete
                </p>
              </div>
            </div>
            <div className={styles.signalList}>
              <div>
                <span className={styles.signalDotHigh} />
                <p>
                  <strong>Financial pressure</strong>
                  Repeated urgency around an unexpected expense
                </p>
              </div>
              <div>
                <span className={styles.signalDotMedium} />
                <p>
                  <strong>Verification behavior</strong>
                  Several video-call delays without a completed call
                </p>
              </div>
              <div>
                <span className={styles.signalDotGood} />
                <p>
                  <strong>Protective signal</strong>
                  Some profile details remained consistent over time
                </p>
              </div>
            </div>
            <p className={styles.previewDisclaimer}>
              Scores are risk indicators, not proof of fraud, identity, or
              safety.
            </p>
          </div>
        </div>
      </section>

      <section
        className={styles.trustStrip}
        aria-label="TrueCheckDating.com commitments"
      >
        <div>
          <strong>Private by design</strong>
          <span>Your cases are not publicly searchable.</span>
        </div>
        <div>
          <strong>No certainty claims</strong>
          <span>Every result includes confidence and limitations.</span>
        </div>
        <div>
          <strong>Built for safer decisions</strong>
          <span>Get practical steps before taking irreversible action.</span>
        </div>
      </section>

      <section className={styles.section}>
        <SectionHeading
          align="center"
          description="TrueCheckDating.com brings several kinds of evidence into one structured review so you can see the whole picture instead of relying on a single clue."
          eyebrow="One private case"
          title="Four checks. One understandable report."
        />
        <div className={styles.featureGrid}>
          {features.map(({ icon: Icon, title, description }) => (
            <article className={styles.featureCard} key={title}>
              <span className={styles.featureIcon}>
                <Icon />
              </span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.howSection}>
        <div className={styles.howInner}>
          <SectionHeading
            description="The process is designed for ordinary users—not investigators or technical experts."
            eyebrow="How it works"
            title="Move from uncertainty to a safer next step."
          />
          <ol className={styles.steps}>
            <li>
              <span>1</span>
              <div>
                <h3>Create a private case</h3>
                <p>
                  Use a nickname and include only the information needed for
                  your review.
                </p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <h3>Review the available evidence</h3>
                <p>
                  Analyze conversation patterns and complete guided profile,
                  image, and video checks.
                </p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <h3>Read the combined report</h3>
                <p>
                  See concern level, confidence, warning signs, protective
                  signals, and practical actions.
                </p>
              </div>
            </li>
          </ol>
          <ButtonLink href="/how-it-works" variant="secondary">
            View the full process <ArrowRightIcon />
          </ButtonLink>
        </div>
      </section>

      <section className={styles.reportSection}>
        <div className={styles.reportCard}>
          <div className={styles.reportIcon}>
            <ReportIcon />
          </div>
          <div>
            <p className={styles.eyebrowText}>Clear, not sensational</p>
            <h2>A report that shows what is known—and what is not.</h2>
            <p>
              TrueCheckDating.com separates supplied evidence, system
              observations, inferences, recommendations, and limitations.
              Missing information lowers confidence instead of automatically
              raising risk.
            </p>
          </div>
          <ul>
            {reportItems.map((item) => (
              <li key={item}>
                <CheckIcon /> {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={styles.privacySection}>
        <div className={styles.privacyInner}>
          <div className={styles.lockBadge}>
            <LockIcon />
          </div>
          <div>
            <p className={styles.eyebrowText}>Privacy comes first</p>
            <h2>Your private concern should not become a public accusation.</h2>
            <p>
              Cases belong to the account owner. Submitted conversations are not
              publicly searchable or sold, and users can delete cases and
              accounts. TrueCheckDating.com is designed to help you make a safer
              decision—not to create a public list of alleged scammers.
            </p>
            <ButtonLink href="/privacy" variant="quiet">
              Read our privacy approach <ArrowRightIcon />
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className={styles.pricingSection}>
        <SectionHeading
          align="center"
          description="Begin with a limited preliminary screening. Pay only when you want the complete combined report or ongoing access."
          eyebrow="Simple starting prices"
          title="Choose the level of help you need."
        />
        <div className={styles.priceGrid}>
          <article className={styles.priceCard}>
            <p className={styles.priceName}>Preliminary screening</p>
            <p className={styles.price}>Free</p>
            <p className={styles.priceDescription}>
              A limited first look at principal concern categories.
            </p>
            <ButtonLink href="/signup" variant="secondary">
              Start free
            </ButtonLink>
          </article>
          <article className={`${styles.priceCard} ${styles.featuredPrice}`}>
            <p className={styles.priceTag}>Most direct</p>
            <p className={styles.priceName}>Full individual report</p>
            <p className={styles.price}>
              $9.99 <span>test price</span>
            </p>
            <p className={styles.priceDescription}>
              Complete report for one case with detailed findings and download.
            </p>
            <ButtonLink href="/signup">Start a case</ButtonLink>
          </article>
          <article className={styles.priceCard}>
            <p className={styles.priceName}>Monthly membership</p>
            <p className={styles.price}>
              $14.99 <span>/ month</span>
            </p>
            <p className={styles.priceDescription}>
              For several cases or repeated analyses during an active
              membership.
            </p>
            <ButtonLink href="/pricing" variant="secondary">
              Compare access
            </ButtonLink>
          </article>
        </div>
        <p className={styles.pricingNote}>
          Prices and usage limits are initial test values and may change after
          private beta testing.
        </p>
      </section>

      <section className={styles.finalCta}>
        <div>
          <p className={styles.eyebrowText}>
            Take a pause before the next step
          </p>
          <h2>Organize the warning signs before making a major decision.</h2>
          <p>
            Start privately. Review the evidence. Decide what verification
            should come next.
          </p>
        </div>
        <ButtonLink href="/signup" size="large">
          Start a private check <ArrowRightIcon />
        </ButtonLink>
      </section>
    </PublicPageShell>
  );
}
