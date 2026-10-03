import * as React from "react";
import { Bus, CarTaxiFront, Clock, Footprints, MapPin, Utensils } from "lucide-react";

import { formatDistance, formatDuration } from "@/lib/format";
import type { ItineraryItem } from "@/lib/fixtures/barcelona";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Price } from "./price";

/**
 * Day timeline. A list, not a stack of cards:
 *   time | rail (map marker number) | activity, location, duration | cost
 * Travel between stops sits on the rail, so the gaps in the day are explained.
 */

const legIcon = { walk: Footprints, transit: Bus, taxi: CarTaxiFront } as const;
const legWord = { walk: "walk", transit: "by metro", taxi: "by taxi" } as const;

function ItineraryTimeline({
  items,
  selectedId,
  className,
}: {
  items: ItineraryItem[];
  selectedId?: string;
  className?: string;
}) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {items.map((item, index) => (
        <li key={item.id} className="flex flex-col">
          {item.legBefore ? <TravelLeg leg={item.legBefore} /> : null}
          <TimelineRow
            item={item}
            selected={item.id === selectedId}
            isLast={index === items.length - 1}
          />
        </li>
      ))}
    </ol>
  );
}

function TimelineRow({
  item,
  selected,
  isLast,
}: {
  item: ItineraryItem;
  selected: boolean;
  isLast: boolean;
}) {
  const isActivity = item.kind === "activity";
  return (
    <div
      className={cn(
        "group grid grid-cols-[48px_32px_minmax(0,1fr)_auto] gap-x-2 rounded-md py-2 pr-2 md:grid-cols-[56px_32px_minmax(0,1fr)_auto] md:gap-x-4",
        selected ? "bg-primary-subtle" : "hover:bg-accent",
      )}
    >
      <time className="pl-2 pt-1 type-label tabular text-foreground">{item.start}</time>

      <div className="relative flex justify-center">
        {!isLast ? (
          <span aria-hidden className="absolute -bottom-2 top-8 w-px bg-border" />
        ) : null}
        {isActivity ? (
          <span
            className={cn(
              "relative flex size-6 items-center justify-center rounded-full type-caption font-semibold tabular",
              selected
                ? "bg-primary text-primary-foreground"
                : "bg-foreground text-background",
            )}
            aria-label={`Map marker ${item.marker}`}
          >
            {item.marker}
          </span>
        ) : (
          <span className="relative flex size-6 items-center justify-center rounded-full border bg-surface text-muted-foreground">
            <Utensils aria-hidden className="size-4" strokeWidth={1.75} />
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-1 pt-px">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className={cn("type-label", !isActivity && "font-normal")}>{item.title}</h4>
          {item.booking === "required" ? <Badge variant="warning">Book ahead</Badge> : null}
          {item.booking === "booked" ? <Badge variant="success">Booked</Badge> : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 type-body text-muted-foreground">
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin aria-hidden className="size-4 shrink-0 text-subtle-foreground" />
            <span className="truncate">{item.location}</span>
          </span>
          <span className="inline-flex items-center gap-1 tabular">
            <Clock aria-hidden className="size-4 shrink-0 text-subtle-foreground" />
            {formatDuration(item.durationMin)}
          </span>
        </div>
      </div>

      <div className="pt-1 text-right">
        <Price value={item.cost} className={cn(!item.cost && "text-muted-foreground")} />
      </div>
    </div>
  );
}

function TravelLeg({ leg }: { leg: NonNullable<ItineraryItem["legBefore"]> }) {
  const Icon = legIcon[leg.mode];
  return (
    <div
      className="grid grid-cols-[48px_32px_minmax(0,1fr)] gap-x-2 md:grid-cols-[56px_32px_minmax(0,1fr)] md:gap-x-4"
      aria-label={`${leg.minutes} minutes ${legWord[leg.mode]}`}
    >
      <span />
      <span className="flex justify-center">
        <span aria-hidden className="h-full w-px border-l border-dashed border-border-strong" />
      </span>
      <span className="inline-flex items-center gap-1 py-1 type-caption text-muted-foreground tabular">
        <Icon aria-hidden className="size-4 text-subtle-foreground" strokeWidth={1.75} />
        {leg.minutes} min {legWord[leg.mode]} · {formatDistance(leg.meters)}
      </span>
    </div>
  );
}

export { ItineraryTimeline };
