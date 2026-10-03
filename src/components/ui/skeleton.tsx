import * as React from "react";

import { cn } from "@/lib/utils";

/** Static placeholder. No shimmer: loading should be calm, not animated. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div aria-hidden className={cn("rounded-sm bg-muted", className)} {...props} />;
}

export { Skeleton };
