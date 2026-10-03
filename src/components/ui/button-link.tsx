import Link from "next/link";
import type { ComponentProps } from "react";

import styles from "./button-link.module.css";

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: "primary" | "secondary" | "quiet";
  size?: "default" | "large";
};

export function ButtonLink({
  className,
  variant = "primary",
  size = "default",
  ...props
}: ButtonLinkProps) {
  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(" ");

  return <Link className={classes} {...props} />;
}
