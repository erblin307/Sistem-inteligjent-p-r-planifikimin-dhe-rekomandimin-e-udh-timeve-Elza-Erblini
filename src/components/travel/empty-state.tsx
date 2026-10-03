import * as React from "react";

import { cn } from "@/lib/utils";

/** Says what is missing and offers the next step. No illustration. */
function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-4 rounded-lg border border-dashed border-border-strong px-6 py-8",
        className,
      )}
    >
      <div className="flex flex-col gap-1">
        <h3 className="type-subheading">{title}</h3>
        <p className="max-w-prose type-body text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export { EmptyState };
