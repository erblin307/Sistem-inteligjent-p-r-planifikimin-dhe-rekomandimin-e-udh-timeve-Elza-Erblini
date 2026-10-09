import * as React from "react";
import { Clock, MapPin, Plus } from "lucide-react";

import { formatDistance, formatDuration } from "@/lib/format";
import type { TravelImage } from "@/contracts/media";
import type { Activity } from "@/lib/fixtures/barcelona";
import { Button } from "@/components/ui/button";
import { ImageFrame } from "./image-frame";
import { MediaCredit } from "./media-credit";
import { Price } from "./price";
import { Rating } from "./rating";

/** Compact activity result. Rows share one hairline-separated list. */
function ActivityRow({
  activity,
  image,
  distanceFrom = "hotel",
  addable = true,
}: {
  activity: Activity;
  /** The place's own photo. Never a stock image: no photo shows the fallback. */
  image?: TravelImage | null | undefined;
  /** False until adding to a day is saved to the itinerary. */
  addable?: boolean;
  /** What the distance is measured from. */
  distanceFrom?: "hotel" | "centre";
}) {
  return (
    <article className="grid grid-cols-[80px_minmax(0,1fr)] gap-4 py-4 md:grid-cols-[120px_minmax(0,1fr)_auto] md:items-center">
      <ImageFrame image={image} size="thumbnail" fallback="place" ratio="4/3" className="rounded-sm" />

      <div className="flex min-w-0 flex-col gap-1">
        <p className="type-caption text-muted-foreground">{activity.category}</p>
        <h3 className="type-label">{activity.title}</h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 type-body text-muted-foreground">
          {activity.rating !== null ? <Rating value={activity.rating} count={activity.reviewCount} /> : null}
          <span className="inline-flex items-center gap-1 tabular">
            <Clock aria-hidden className="size-4 text-subtle-foreground" />
            {formatDuration(activity.durationMin)}
          </span>
          <span className="inline-flex items-center gap-1 tabular">
            <MapPin aria-hidden className="size-4 text-subtle-foreground" />
            {formatDistance(activity.distanceM)} from {distanceFrom}
          </span>
        </div>
        {activity.reason ? (
          <p className="type-caption text-muted-foreground">{activity.reason}</p>
        ) : null}
        {/* The thumbnail is too small for a caption, so its credit sits here. */}
        {image ? <MediaCredit image={image} /> : null}
      </div>

      <div className="col-span-2 flex items-center justify-between gap-4 md:col-span-1 md:flex-col md:items-end">
        <Price value={activity.price} unit="person" />
        {addable ? (
          <Button size="sm" variant="secondary">
            <Plus aria-hidden /> Add to day
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export { ActivityRow };
