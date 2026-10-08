import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Lock, Map as MapIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ItineraryTimeline } from "@/components/travel/itinerary-timeline";
import { MapCanvas } from "@/components/travel/map-canvas";
import { dayTwo } from "@/lib/fixtures/barcelona";
import { loadWorkspace } from "../../data";
import { NotPlannedYet } from "../not-planned";

export const metadata: Metadata = { title: "Itinerary" };

const days = ["Mon 12", "Tue 13", "Wed 14", "Thu 15", "Fri 16", "Sat 17"];

export default async function ItineraryPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const workspace = await loadWorkspace(tripId);
  if (workspace.kind === "trip") {
    return (
      <NotPlannedYet
        tripId={tripId}
        title="No itinerary yet"
        description="Day-by-day itinerary generation is not built yet. The recommended activities for this trip are ready to review."
      />
    );
  }

  return (
    <div className="mx-auto grid w-full max-w-wide xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section aria-label="Day plan" className="flex min-w-0 flex-col gap-6 px-4 py-6 md:px-6 md:py-8 xl:px-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button size="icon-sm" variant="ghost" aria-label="Previous day"><ChevronLeft aria-hidden /></Button>
              <h2 className="type-heading">Tuesday, 13 July</h2>
              <Button size="icon-sm" variant="ghost" aria-label="Next day"><ChevronRight aria-hidden /></Button>
            </div>
            <Button asChild variant="secondary" size="sm" className="xl:hidden">
              <Link href={`/trips/${tripId}/map`}><MapIcon aria-hidden /> Map</Link>
            </Button>
          </div>
          <div className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
            {days.map((day, index) => (
              <button
                key={day}
                type="button"
                aria-pressed={index === 1}
                className="h-8 shrink-0 rounded-md border px-4 type-label tabular text-muted-foreground transition-colors hover:text-foreground aria-pressed:border-foreground aria-pressed:text-foreground"
              >
                {day}
              </button>
            ))}
          </div>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 type-body text-muted-foreground tabular">
            <span>3 activities · 2 meals</span>
            <span>Walking 2.9 km</span>
            <span className="inline-flex items-center gap-1"><Lock aria-hidden className="size-4 text-subtle-foreground" /> 1 locked</span>
            <span className="font-medium text-foreground">€252 planned</span>
          </p>
        </div>
        <ItineraryTimeline items={dayTwo} selectedId="i4" />
        <div className="hidden min-h-80 overflow-hidden rounded-lg border md:block xl:hidden">
          <MapCanvas />
        </div>
      </section>

      <aside aria-label="Map" className="sticky top-0 hidden h-dvh border-l xl:block">
        <MapCanvas />
      </aside>
    </div>
  );
}
