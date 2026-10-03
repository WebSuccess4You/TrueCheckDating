import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

const baseProps: IconProps = {
  "aria-hidden": true,
  fill: "none",
  focusable: "false",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  strokeWidth: 1.8,
  viewBox: "0 0 24 24",
};

export function ShieldCheckIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M12 3 5.5 5.8v5.4c0 4.2 2.7 8 6.5 9.8 3.8-1.8 6.5-5.6 6.5-9.8V5.8L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function MessageSearchIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M4 5.5h11.5A2.5 2.5 0 0 1 18 8v4" />
      <path d="M4 5.5A2.5 2.5 0 0 0 1.5 8v7A2.5 2.5 0 0 0 4 17.5h4l3.5 3v-3" />
      <circle cx="17" cy="16" r="3.5" />
      <path d="m19.5 18.5 2 2" />
    </svg>
  );
}

export function ProfileIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c.5-4 2.5-6 5.5-6s5 2 5.5 6" />
      <path d="m16 10 1.5 1.5L21 8" />
    </svg>
  );
}

export function VideoCheckIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10 5-2v8l-5-2" />
      <path d="m7 12 1.7 1.7L12 10.5" />
    </svg>
  );
}

export function ImageSearchIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="3" y="4" width="13" height="13" rx="2" />
      <circle cx="8" cy="9" r="1.5" />
      <path d="m4 15 3.5-3.5L10 14l2-2 4 4" />
      <circle cx="17" cy="17" r="3.5" />
      <path d="m19.5 19.5 2 2" />
    </svg>
  );
}

export function ReportIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M6 3h9l3 3v15H6z" />
      <path d="M15 3v4h4" />
      <path d="M9 11h6M9 15h6M9 19h4" />
    </svg>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M5 12h14M14 7l5 5-5 5" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <rect x="5" y="10" width="14" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...baseProps} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
