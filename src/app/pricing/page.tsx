import type { Metadata } from "next";

import { PublicPageShell } from "@/components/public-page-shell";
import { ButtonLink } from "@/components/ui/button-link";

import styles from "../public-pages.module.css";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Compare the free preliminary screening, one-time full report, and monthly TrueCheckDating.com membership.",
};

const products = [
  {
    name: "Preliminary screening",
    price: "Free",
    suffix: "",
    summary: "A limited first look at principal concern categories.",
    items: [
      "One preliminary screening per account",
      "Limited conversation length",
      "Main concern level",
      "Selected warning categories",
    ],
    cta: "Start free",
    href: "/signup",
    featured: false,
  },
  {
    name: "Full individual report",
    price: "$9.99",
    suffix: "test price",
    summary: "A complete combined report for one private case.",
    items: [
      "Detailed component findings",
      "Confidence and evidence completeness",
      "Recommended next steps",
      "Printable or downloadable report",
    ],
    cta: "Start a case",
    href: "/signup",
    featured: true,
  },
  {
    name: "Monthly membership",
    price: "$14.99",
    suffix: "/ month",
    summary: "For several cases or repeated analyses.",
    items: [
      "Multiple active cases",
      "Repeated analyses within usage limits",
      "Full reports and updates",
      "Billing management",
    ],
    cta: "Start with an account",
    href: "/signup",
    featured: false,
  },
];

export default function PricingPage() {
  return (
    <PublicPageShell>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Simple starting prices</p>
          <h1>Begin free. Pay for the depth you need.</h1>
          <p className={styles.lead}>
            These are initial test prices for the private beta and early
            release. Exact usage limits and pricing may change in response to
            real customer needs and operating costs.
          </p>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.priceGrid}>
          {products.map((product) => (
            <article
              className={`${styles.priceCard} ${product.featured ? styles.featured : ""}`}
              key={product.name}
            >
              <p className={styles.priceName}>{product.name}</p>
              <p className={styles.price}>
                {product.price}{" "}
                {product.suffix ? <span>{product.suffix}</span> : null}
              </p>
              <p className={styles.priceSummary}>{product.summary}</p>
              <ul>
                {product.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <ButtonLink
                href={product.href}
                variant={product.featured ? "primary" : "secondary"}
              >
                {product.cta}
              </ButtonLink>
            </article>
          ))}
        </div>

        <div className={styles.notice}>
          <strong>No automatic proof or guaranteed outcome</strong>
          <p>
            Payment unlocks a more complete analysis and report. It does not
            purchase certainty about another person’s identity, intent, or
            safety.
          </p>
        </div>
      </section>
    </PublicPageShell>
  );
}
