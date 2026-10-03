import * as React from "react";

import { cn } from "@/lib/utils";

/** Application page title. Sized as a title, not a banner. */
function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="type-title">{title}</h1>
        {description ? (
          <p className="max-w-prose type-body text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

/** Section inside a page. Spacing and a heading, not a card. */
function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="type-heading">{title}</h2>
        {description ? <p className="type-body text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export { PageHeader, SectionHeader };
