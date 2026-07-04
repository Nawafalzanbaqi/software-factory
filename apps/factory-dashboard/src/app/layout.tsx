import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/*
 * Typography for the control room: Inter for UI, JetBrains Mono for IDs,
 * phases, counts and code. next/font self-hosts at build time (no runtime
 * requests, no new dependency); the latin subset falls back per-glyph to the
 * system stack for the form's Arabic labels.
 */
const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Factory Dashboard",
    template: "%s · Factory Dashboard",
  },
  description: "Internal control plane for the Software Factory (Phase 3).",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark ${fontSans.variable} ${fontMono.variable}`}
    >
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
