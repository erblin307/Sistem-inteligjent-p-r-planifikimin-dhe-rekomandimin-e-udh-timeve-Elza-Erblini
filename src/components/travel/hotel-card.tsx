import * as React from "react";
import { Check } from "lucide-react";

import { formatDistance, formatMoney, plural } from "@/lib/format";
import type { Hotel } from "@/lib/fixtures/barcelona";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageFrame } from "./image-frame";
import { MetaList } from "./meta";
import { HotelStars, Rating } from "./rating";

/**
 * Booking-style result row. Image left, facts in the middle, price and the
 * decision on the right. On mobile the image goes on top and the price block
 * becomes a footer row.
 */
function HotelCard({
  hotel,
  selected = false,
  recommended = false,
  imageSrc,
  selectable = true,
}: {
  hotel: Hotel;
  selected?: boolean;
  recommended?: boolean;
  imageSrc?: string | undefined;
  /** False until choosing a hotel is saved to the trip. */
  selectable?: boolean;
}) {
  const total = {
    amountMinor: hotel.pricePerNight.amountMinor * hotel.nights * hotel.rooms,
    currency: hotel.pricePerNight.currency,
  };

  return (
    <article
      className={cn(
        "grid overflow-hidden rounded-lg border bg-card md:grid-cols-[240px_minmax(0,1fr)_200px]",
        selected && "border-primary",
      )}
    >
      <div className="p-2 md:p-4 md:pr-0">
        <ImageFrame src={imageSrc} alt={hotel.name} ratio="4/3" className="max-md:aspect-video" />
      </div>

      <div className="flex min-w-0 flex-col gap-2 px-4 pb-4 md:p-4">
        <div className="flex flex-wrap items-center gap-2">
          {recommended ? <Badge variant="brand">Recommended</Badge> : null}
          {selected ? (
            <Badge variant="neutral">
              <Check aria-hidden /> In your plan
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="type-subheading">{hotel.name}</h3>
            {hotel.stars ? <HotelStars stars={hotel.stars} /> : null}
          </div>
          <MetaList
            items={[hotel.area, `${formatDistance(hotel.distanceToCentreM)} from centre`]}
          />
        </div>
        {hotel.rating !== null ? <Rating value={hotel.rating} count={hotel.reviewCount} showWord /> : null}
        <ul className="flex flex-wrap gap-x-4 gap-y-1 type-body text-muted-foreground">
          {hotel.amenities.slice(0, 3).map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
        {hotel.reasons.length ? (
          <p className="mt-auto pt-2 type-caption text-muted-foreground">
            <span className="font-medium text-foreground">Why it fits: </span>
            {hotel.reasons.join(" · ")}
          </p>
        ) : null}
      </div>

      <div className="flex items-end justify-between gap-4 border-t px-4 py-4 md:flex-col md:items-end md:justify-between md:border-l md:border-t-0">
        <div className="flex flex-col md:items-end">
          {hotel.freeCancellation === true ? (
            <span className="type-caption font-medium text-success">Free cancellation</span>
          ) : hotel.freeCancellation === false ? (
            <span className="type-caption text-muted-foreground">Non-refundable</span>
          ) : null}
        </div>
        <div className="flex flex-col items-end gap-2 md:w-full">
          <div className="text-right">
            <p className="tabular">
              <span className="type-figure">{formatMoney(hotel.pricePerNight)}</span>
              <span className="type-body text-muted-foreground"> / night</span>
            </p>
            <p className="type-caption text-muted-foreground tabular">
              {formatMoney(total)} total · {plural(hotel.nights, "night")}, {plural(hotel.rooms, "room")}
            </p>
          </div>
          {selectable ? (
            <Button variant={selected ? "secondary" : "primary"} className="md:w-full">
              {selected ? "Selected" : "Select hotel"}
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export { HotelCard };
