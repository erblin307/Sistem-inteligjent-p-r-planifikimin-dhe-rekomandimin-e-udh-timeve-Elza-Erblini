import * as React from "react";
import { Star } from "lucide-react";

import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";

/** One scale for the whole product: guest rating out of 5, one decimal. */
function ratingWord(rating: number) {
  if (rating >= 4.6) return "Exceptional";
  if (rating >= 4.3) return "Excellent";
  if (rating >= 4.0) return "Very good";
  if (rating >= 3.5) return "Good";
  return "Fair";
}

function Rating({
  value,
  count,
  showWord = false,
  className,
}: {
  value: number;
  count?: number;
  showWord?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 type-body tabular", className)}>
      <Star aria-hidden className="size-4 fill-current text-foreground" />
      <span className="font-medium text-foreground">{value.toFixed(1)}</span>
      {showWord ? <span className="text-foreground">{ratingWord(value)}</span> : null}
      {count !== undefined ? (
        <span className="text-muted-foreground">({formatCount(count)})</span>
      ) : null}
      <span className="sr-only">out of 5</span>
    </span>
  );
}

/** Hotel class. Rendered as small glyphs in ink, never in a highlight colour. */
function HotelStars({ stars, className }: { stars: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label={`${stars}-star hotel`}
      className={cn("inline-flex items-center text-muted-foreground", className)}
    >
      {Array.from({ length: stars }, (_, i) => (
        <Star key={i} aria-hidden className="size-4 fill-current" strokeWidth={0} />
      ))}
    </span>
  );
}

export { Rating, HotelStars, ratingWord };
