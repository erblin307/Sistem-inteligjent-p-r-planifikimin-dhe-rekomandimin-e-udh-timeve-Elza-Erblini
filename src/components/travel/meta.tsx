import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Inline metadata row: "Gràcia · 2.1 km from centre · Free cancellation".
 * Items are separated with a middle dot, which wraps cleanly on mobile.
 */
function MetaList({ items, className }: { items: React.ReactNode[]; className?: string }) {
  const visible = items.filter(Boolean);
  return (
    <ul className={cn("flex flex-wrap items-center type-body text-muted-foreground", className)}>
      {visible.map((item, i) => (
        <li key={i} className="flex items-center">
          {i > 0 ? (
            <span aria-hidden className="px-2 text-subtle-foreground">
              ·
            </span>
          ) : null}
          {item}
        </li>
      ))}
    </ul>
  );
}

function MetaItem({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-subtle-foreground">
      {icon}
      {children}
    </span>
  );
}

export { MetaList, MetaItem };
