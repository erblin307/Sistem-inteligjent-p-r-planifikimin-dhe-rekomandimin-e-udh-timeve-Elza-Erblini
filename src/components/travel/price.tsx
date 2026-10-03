import * as React from "react";

import { formatMoney, type Money } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Money display. Always tabular; "Free" when there is no cost. */
function Price({
  value,
  unit,
  size = "body",
  className,
}: {
  value: Money | null;
  unit?: string;
  size?: "body" | "figure";
  className?: string;
}) {
  return (
    <span className={cn("tabular", className)}>
      <span className={cn(size === "figure" ? "type-figure" : "type-label")}>
        {value ? formatMoney(value) : "Free"}
      </span>
      {unit && value ? <span className="type-body text-muted-foreground"> / {unit}</span> : null}
    </span>
  );
}

export { Price };
