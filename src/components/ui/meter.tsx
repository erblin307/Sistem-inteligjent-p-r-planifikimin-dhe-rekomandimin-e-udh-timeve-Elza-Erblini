import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A thin, labelled proportion bar. Used where a share of a whole matters
 * (budget used, category share). It is not a chart and has no decoration.
 */
function Meter({
  value,
  max,
  label,
  tone = "brand",
  className,
}: {
  value: number;
  max: number;
  label: string;
  tone?: "brand" | "neutral" | "warning" | "danger";
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn(
          "h-full rounded-full",
          tone === "brand" && "bg-primary",
          tone === "neutral" && "bg-subtle-foreground",
          tone === "warning" && "bg-warning",
          tone === "danger" && "bg-destructive",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export { Meter };
