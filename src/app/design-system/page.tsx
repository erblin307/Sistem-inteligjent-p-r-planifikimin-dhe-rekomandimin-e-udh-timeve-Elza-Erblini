import type { Metadata } from "next";
import Link from "next/link";

import { Components } from "./_components/components";
import { Foundations } from "./_components/foundations";
import { Patterns } from "./_components/patterns";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export const metadata: Metadata = { title: "Design system" };

const index = [
  {
    group: "Foundations",
    items: [
      ["colour", "Colour"],
      ["typography", "Typography"],
      ["spacing", "Spacing and layout"],
      ["shape", "Shape and elevation"],
      ["icons", "Icons"],
    ],
  },
  {
    group: "Components",
    items: [
      ["buttons", "Buttons"],
      ["forms", "Forms"],
      ["selection", "Selection"],
      ["navigation", "Tabs, badges and menus"],
    ],
  },
  {
    group: "Travel patterns",
    items: [
      ["trip-header", "Workspace header"],
      ["itinerary", "Itinerary"],
      ["hotels", "Hotel result"],
      ["activities", "Activity result"],
      ["budget", "Budget"],
      ["map", "Map markers"],
      ["media", "Images"],
      ["empty", "Empty states"],
    ],
  },
];

const principles = [
  ["Content first", "Photos, places and prices carry the interface. Chrome stays neutral."],
  ["One accent", "Harbour blue marks what you can act on or what is selected. Nothing else is coloured."],
  ["Borders, not shadows", "Hierarchy comes from hairlines and spacing. Only floating layers are elevated."],
  ["Facts in fixed places", "Time, duration, rating and price sit in the same position on every row."],
  ["Explain the recommendation", "Every ranked result says why it fits, in plain words."],
];

export default function DesignSystemPage() {
  return (
    <div className="mx-auto flex w-full max-w-wide gap-12 px-4 md:px-6 xl:px-8">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-8 overflow-y-auto py-8 xl:flex">
        <Link href="#top" className="type-subheading">
          Itinera Design
        </Link>
        <nav aria-label="Design system" className="flex flex-col gap-6">
          {index.map((g) => (
            <div key={g.group} className="flex flex-col gap-1">
              <p className="pb-1 type-overline text-muted-foreground">{g.group}</p>
              {g.items.map(([id, label]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="rounded-sm py-1 type-body text-muted-foreground transition-colors hover:text-foreground"
                >
                  {label}
                </a>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <main id="top" className="flex min-w-0 flex-1 flex-col gap-12 py-8 md:py-12">
        <header className="flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <p className="type-caption text-muted-foreground">Version 0.1 · October 2026</p>
              <h1 className="type-title">Design system</h1>
              <p className="max-w-prose type-reading text-muted-foreground">
                Tokens, components and travel patterns for Itinera. Built on shadcn/ui and Radix,
                restyled through the tokens in <code className="font-mono type-body">globals.css</code>.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/design-system/preview"
                className="hidden h-8 items-center rounded-md px-2 type-label text-primary hover:underline md:inline-flex"
              >
                Workspace preview
              </Link>
              <ThemeToggle />
            </div>
          </div>
          <ul className="grid gap-x-8 gap-y-6 border-t pt-6 md:grid-cols-2 xl:grid-cols-3">
            {principles.map(([title, body]) => (
              <li key={title} className="flex flex-col gap-1">
                <span className="type-label">{title}</span>
                <span className="type-body text-muted-foreground">{body}</span>
              </li>
            ))}
          </ul>
        </header>

        <Foundations />
        <Components />
        <Patterns />
      </main>
    </div>
  );
}
