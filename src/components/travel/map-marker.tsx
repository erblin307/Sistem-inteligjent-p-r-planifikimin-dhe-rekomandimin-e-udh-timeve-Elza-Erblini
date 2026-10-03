import * as React from "react";
import { BedDouble } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Map markers. The number matches the itinerary rail, so the list and the map
 * can be read together. Hotel is the only marker with an icon.
 */
function MapMarker({
  label,
  state = "default",
  className,
}: {
  label: number;
  state?: "default" | "selected" | "muted";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-8 items-center justify-center rounded-full border-2 border-surface type-caption font-semibold tabular",
        state === "default" && "bg-foreground text-background",
        state === "selected" && "size-10 bg-primary text-primary-foreground type-label",
        state === "muted" && "bg-surface text-muted-foreground ring-1 ring-border-strong",
        className,
      )}
    >
      {label}
    </span>
  );
}

function HotelMarker({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-8 items-center justify-center rounded-md border-2 border-surface bg-primary text-primary-foreground",
        className,
      )}
    >
      <BedDouble aria-hidden className="size-4" />
      <span className="sr-only">Your hotel</span>
    </span>
  );
}

export { MapMarker, HotelMarker };
