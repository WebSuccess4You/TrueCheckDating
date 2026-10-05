"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { MenuIcon, ShieldCheckIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button-link";

import styles from "./site-header.module.css";

const navItems = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/privacy", label: "Privacy" },
];
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const ready = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link
          className={styles.brand}
          href="/"
          aria-label="TrueCheckDating.com home"
        >
          <span className={styles.brandIcon}>
            <ShieldCheckIcon />
          </span>
          <span>TrueCheckDating.com</span>
        </Link>

        <button
          aria-controls="primary-navigation"
          aria-expanded={open}
          aria-label="Toggle navigation"
          className={styles.menuButton}
          disabled={!ready}
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          <MenuIcon />
        </button>

        <nav
          aria-label="Primary navigation"
          className={`${styles.navigation} ${open ? styles.open : ""}`}
          id="primary-navigation"
        >
          <div className={styles.links}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className={styles.actions}>
            <ButtonLink href="/login" variant="quiet">
              Log in
            </ButtonLink>
            <ButtonLink href="/signup">Start a private check</ButtonLink>
          </div>
        </nav>
      </div>
    </header>
  );
}
