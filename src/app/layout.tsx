import type { Metadata, Viewport } from "next";

import { publicEnvironment } from "@/lib/env";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(publicEnvironment.NEXT_PUBLIC_APP_URL),
  title: {
    default:
      "TrueCheckDating.com — Review online-dating warning signs privately",
    template: `%s | ${publicEnvironment.NEXT_PUBLIC_APP_NAME}`,
  },
  description:
    "Review online-dating conversations, profile claims, image-search findings, and verification behavior for warning signs before sending money or making major commitments.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
  themeColor: "#123a57",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html data-scroll-behavior="smooth" lang="en">
      <body>{children}</body>
    </html>
  );
}
