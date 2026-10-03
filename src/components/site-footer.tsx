import Link from "next/link";

import { ShieldCheckIcon } from "@/components/icons";

import styles from "./site-footer.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.grid}>
        <div className={styles.about}>
          <div className={styles.brand}>
            <ShieldCheckIcon />
            <span>TrueCheckDating.com</span>
          </div>
          <p>
            A private, structured way to review online-dating warning signs,
            inconsistencies, and verification behavior.
          </p>
        </div>

        <div>
          <h2>Product</h2>
          <ul>
            <li>
              <Link href="/how-it-works">How it works</Link>
            </li>
            <li>
              <Link href="/pricing">Pricing</Link>
            </li>
            <li>
              <Link href="/signup">Start a private check</Link>
            </li>
          </ul>
        </div>

        <div>
          <h2>Legal</h2>
          <ul>
            <li>
              <Link href="/privacy">Privacy</Link>
            </li>
            <li>
              <Link href="/terms">Terms</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.bottom}>
        <p>© 2026 TrueCheckDating.com. All rights reserved.</p>
        <p>
          TrueCheckDating.com provides risk indicators and educational
          guidance—not proof that anyone is genuine, fraudulent, criminal, or
          safe.
        </p>
      </div>
    </footer>
  );
}
