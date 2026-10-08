import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";

import { THEME_INIT_SCRIPT } from "@/lib/theme-script";

import "./globals.css";

const sans = Instrument_Sans({
  variable: "--font-sans-face",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Itinera", template: "%s · Itinera" },
  description: "Plan trips with recommended hotels, activities, itineraries and budgets.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={sans.variable} suppressHydrationWarning>
      <head>
        {/* Applies the stored or system theme before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
