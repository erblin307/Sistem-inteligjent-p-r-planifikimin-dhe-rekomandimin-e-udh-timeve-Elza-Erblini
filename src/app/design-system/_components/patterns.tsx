import * as React from "react";
import Link from "next/link";
import { Plus, Share } from "lucide-react";

import { activities, budgetLines, dayTwo, hotels, trip } from "@/lib/fixtures/barcelona";
import { Button } from "@/components/ui/button";
import { tabsListClass, tabsTriggerClass } from "@/components/ui/tabs-styles";
import { ActivityRow } from "@/components/travel/activity-row";
import { BudgetSummary, BudgetTable } from "@/components/travel/budget-breakdown";
import { EmptyState } from "@/components/travel/empty-state";
import { HotelCard } from "@/components/travel/hotel-card";
import { ItineraryTimeline } from "@/components/travel/itinerary-timeline";
import { HotelMarker, MapMarker } from "@/components/travel/map-marker";
import { TripHeader } from "@/components/travel/trip-header";
import { DocSection, Rule, Stage } from "./specimen";

const workspaceTabs = ["Overview", "Itinerary", "Map", "Hotels", "Activities", "Budget"];

export function Patterns() {
  return (
    <>
      <DocSection
        id="trip-header"
        title="Trip workspace header"
        description="The trip is the object; tabs are views of it. Dates, party size and budget stay above the tabs because every view depends on them."
      >
        <Stage tone="canvas" className="flex flex-col gap-6 pb-0 md:pb-0">
          <TripHeader
            trip={trip}
            actions={
              <>
                <Button variant="secondary" size="sm">
                  <Share aria-hidden /> Share
                </Button>
                <Button variant="secondary" size="sm">
                  Edit trip
                </Button>
              </>
            }
          />
          <nav aria-label="Trip workspace" className={tabsListClass("underline")}>
            {workspaceTabs.map((t) => (
              <Link
                key={t}
                href="#trip-header"
                aria-current={t === "Itinerary" ? "page" : undefined}
                className={tabsTriggerClass("underline")}
              >
                {t}
              </Link>
            ))}
          </nav>
        </Stage>
      </DocSection>

      <DocSection
        id="itinerary"
        title="Itinerary"
        description="A timeline, not a stack of cards. Each row answers when, what, where, how long and how much. Travel between stops sits on the rail. Activity numbers match the map markers."
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Stage className="flex flex-col gap-4 px-2 md:px-4">
            <div className="flex items-baseline justify-between gap-4 px-2">
              <h3 className="type-subheading">Tuesday, 13 July</h3>
              <span className="type-body text-muted-foreground tabular">Day 2 · €252 planned</span>
            </div>
            <ItineraryTimeline items={dayTwo} selectedId="i4" />
          </Stage>
          <Stage tone="canvas" className="relative min-h-80 overflow-hidden p-0 md:p-0">
            <MapCanvas />
          </Stage>
        </div>
        <ul className="flex max-w-prose flex-col gap-2">
          <Rule kind="do">Keep time, title and cost on fixed columns so a day can be scanned top to bottom.</Rule>
          <Rule kind="do">Show meals as lighter rows. They anchor the day but are not the plan.</Rule>
          <Rule kind="dont">Wrap each stop in its own floating card.</Rule>
        </ul>
      </DocSection>

      <DocSection
        id="hotels"
        title="Hotel result"
        description="Built like a booking result: photo, name and class, area, guest rating, three amenities that matter, then price per night and total for the stay. The reason line explains the recommendation in plain words."
      >
        <div className="flex flex-col gap-4">
          {hotels.map((h, i) => (
            <HotelCard key={h.id} hotel={h} recommended={i === 0} selected={i === 0} />
          ))}
        </div>
      </DocSection>

      <DocSection
        id="activities"
        title="Activity result"
        description="Rows in one list separated by hairlines. Category, rating, duration and distance from the hotel are always in the same place. Price is per person."
      >
        <Stage className="py-0 md:py-0">
          <div className="divide-y">
            {activities.map((a) => (
              <ActivityRow key={a.id} activity={a} />
            ))}
          </div>
        </Stage>
      </DocSection>

      <DocSection
        id="budget"
        title="Budget"
        description="Three figures answer whether the trip is affordable. The breakdown is a table, because six numbers read faster than a chart."
      >
        <Stage className="flex flex-col gap-8">
          <BudgetSummary total={trip.budget} lines={budgetLines} />
          <BudgetTable total={trip.budget} lines={budgetLines} />
        </Stage>
      </DocSection>

      <DocSection
        id="map"
        title="Map markers"
        description="Markers use ink on the basemap so the brand colour can mark the selected stop. The hotel is the only square marker."
      >
        <Stage className="flex flex-wrap items-center gap-8">
          {[
            { el: <MapMarker label={1} />, name: "Stop", use: "Planned activity" },
            { el: <MapMarker label={2} state="selected" />, name: "Selected", use: "Hovered or open in list" },
            { el: <MapMarker label={4} state="muted" />, name: "Other day", use: "Visible when “All days” is on" },
            { el: <HotelMarker />, name: "Hotel", use: "Start and end of every day" },
          ].map((m) => (
            <div key={m.name} className="flex items-center gap-4">
              <span className="flex size-10 items-center justify-center">{m.el}</span>
              <span className="flex flex-col">
                <span className="type-label">{m.name}</span>
                <span className="type-caption text-muted-foreground">{m.use}</span>
              </span>
            </div>
          ))}
        </Stage>
      </DocSection>

      <DocSection
        id="empty"
        title="Empty states"
        description="State what is missing and give the next step. No illustrations, no jokes."
      >
        <EmptyState
          title="No saved places yet"
          description="Save hotels and activities while you browse a trip. They appear here so you can add them to any plan."
          action={
            <Button variant="secondary">
              <Plus aria-hidden /> Plan a trip
            </Button>
          }
        />
      </DocSection>
    </>
  );
}

/**
 * Stand-in for the MapLibre basemap so markers can be judged against a
 * map-like ground. The real map component replaces this.
 */
function MapCanvas() {
  const stops = [
    { n: 1, x: "56%", y: "46%" },
    { n: 2, x: "38%", y: "22%", selected: true },
    { n: 3, x: "62%", y: "18%" },
  ];
  return (
    <div className="absolute inset-0">
      <svg aria-hidden className="absolute inset-0 size-full text-border-strong">
        <defs>
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M0 0H48M0 0V48" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.55" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      <svg
        aria-hidden
        className="absolute inset-0 size-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polyline
          points="44,68 56,46 38,22 62,18"
          vectorEffect="non-scaling-stroke"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity="0.9"
        />
      </svg>
      <span className="absolute left-[44%] top-[68%] -translate-x-1/2 -translate-y-1/2">
        <HotelMarker />
      </span>
      {stops.map((s) => (
        <span
          key={s.n}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: s.x, top: s.y }}
        >
          <MapMarker label={s.n} state={s.selected ? "selected" : "default"} />
        </span>
      ))}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-4 rounded-md border bg-popover px-4 py-2 shadow-overlay">
        <span className="flex min-w-0 flex-col">
          <span className="truncate type-label">Park Güell</span>
          <span className="type-caption text-muted-foreground tabular">15:00 · 2h · €36</span>
        </span>
        <Button size="sm" variant="secondary">
          Details
        </Button>
      </div>
    </div>
  );
}
