import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";

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
      <body>{children}</body>
    </html>
  );
}
