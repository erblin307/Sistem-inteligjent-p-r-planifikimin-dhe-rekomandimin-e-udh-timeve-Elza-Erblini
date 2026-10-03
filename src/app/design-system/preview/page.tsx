import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Lock, Map as MapIcon, Share } from "lucide-react";

import { dayTwo, trip } from "@/lib/fixtures/barcelona";
import { AppShell } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { tabsListClass, tabsTriggerClass } from "@/components/ui/tabs-styles";
import { ItineraryTimeline } from "@/components/travel/itinerary-timeline";
import { HotelMarker, MapMarker } from "@/components/travel/map-marker";
import { TripHeader } from "@/components/travel/trip-header";

export const metadata: Metadata = { title: "Workspace preview" };

const tabs = ["Overview", "Itinerary", "Map", "Hotels", "Activities", "Budget"];
const days = ["Mon 12", "Tue 13", "Wed 14", "Thu 15", "Fri 16", "Sat 17"];

/**
 * Composition check: the design system assembled into the itinerary view of
 * the trip workspace, inside the real app shell.
 */
export default function WorkspacePreview() {
  return (
    <AppShell>
      <div className="flex min-h-dvh flex-col">
        <div className="border-b bg-background px-4 pt-6 md:px-6 md:pt-8 xl:px-8">
          <div className="mx-auto flex max-w-wide flex-col gap-6">
            <TripHeader
              trip={trip}
              actions={
                <>
                  <Button variant="secondary" size="sm">
                    <Share aria-hidden /> Share
                  </Button>
                  <Button variant="secondary" size="sm" className="hidden md:inline-flex">
                    Edit trip
                  </Button>
                </>
              }
            />
            <nav aria-label="Trip workspace" className={tabsListClass("underline")}>
              {tabs.map((t) => (
                <Link
                  key={t}
                  href="/design-system/preview"
                  aria-current={t === "Itinerary" ? "page" : undefined}
                  className={tabsTriggerClass("underline")}
                >
                  {t}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-wide flex-1 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <section aria-label="Day plan" className="flex min-w-0 flex-col gap-6 px-2 py-6 md:px-4 xl:px-6">
            <div className="flex flex-col gap-4 px-2">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Button size="icon-sm" variant="ghost" aria-label="Previous day">
                    <ChevronLeft aria-hidden />
                  </Button>
                  <h2 className="type-heading">Tuesday, 13 July</h2>
                  <Button size="icon-sm" variant="ghost" aria-label="Next day">
                    <ChevronRight aria-hidden />
                  </Button>
                </div>
                <Button variant="secondary" size="sm" className="xl:hidden">
                  <MapIcon aria-hidden /> Map
                </Button>
              </div>
              <div className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
                {days.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={i === 1}
                    className="h-8 shrink-0 rounded-md border px-4 type-label tabular text-muted-foreground transition-colors hover:text-foreground aria-pressed:border-foreground aria-pressed:text-foreground"
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1 type-body text-muted-foreground tabular">
                <span>3 activities · 2 meals</span>
                <span>Walking 2.9 km</span>
                <span className="inline-flex items-center gap-1">
                  <Lock aria-hidden className="size-4 text-subtle-foreground" /> 1 locked
                </span>
                <span className="font-medium text-foreground">€252 planned</span>
              </p>
            </div>
            <ItineraryTimeline items={dayTwo} selectedId="i4" />
          </section>

          <aside
            aria-label="Map"
            className="sticky top-0 hidden h-dvh border-l bg-muted xl:block"
          >
            <div className="relative size-full">
              <div className="absolute inset-0 flex items-center justify-center type-caption text-subtle-foreground">
                Basemap (MapLibre)
              </div>
              <span className="absolute left-[44%] top-[68%] -translate-x-1/2 -translate-y-1/2">
                <HotelMarker />
              </span>
              {[
                { n: 1, x: "56%", y: "46%" },
                { n: 2, x: "38%", y: "26%", selected: true },
                { n: 3, x: "64%", y: "20%" },
              ].map((s) => (
                <span
                  key={s.n}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: s.x, top: s.y }}
                >
                  <MapMarker label={s.n} state={s.selected ? "selected" : "default"} />
                </span>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
