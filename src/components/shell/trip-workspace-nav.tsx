"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { tabsListClass, tabsTriggerClass } from "@/components/ui/tabs-styles";

const sections = [
  { slug: "overview", label: "Overview" },
  { slug: "itinerary", label: "Itinerary" },
  { slug: "map", label: "Map" },
  { slug: "hotels", label: "Hotels" },
  { slug: "activities", label: "Activities" },
  { slug: "budget", label: "Budget" },
] as const;

/** Route-based trip navigation shared by every workspace view. */
function TripWorkspaceNav({ tripId }: { tripId: string }) {
  const pathname = usePathname();

  return (
    <div className="sticky top-14 z-20 border-b bg-background md:top-0">
      <nav
        aria-label="Trip workspace"
        className={`${tabsListClass("underline")} mx-auto max-w-wide px-4 md:px-6 xl:px-8`}
      >
        {sections.map((section) => {
          const href = `/trips/${tripId}/${section.slug}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={section.slug}
              href={href}
              aria-current={active ? "page" : undefined}
              className={tabsTriggerClass("underline")}
            >
              {section.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export { TripWorkspaceNav };
