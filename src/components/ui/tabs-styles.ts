import { cn } from "@/lib/utils";

/*
 * Tab styles live outside the client component so server-rendered,
 * route-based tabs (<Link aria-current="page">) can share them.
 */

export type TabsVariant = "underline" | "segmented";

export function tabsListClass(variant: TabsVariant) {
  return variant === "underline"
    ? "flex items-stretch gap-6 overflow-x-auto border-b [scrollbar-width:none]"
    : "inline-flex h-10 max-w-full items-center gap-1 overflow-x-auto rounded-md border bg-surface p-1 [scrollbar-width:none]";
}

export function tabsTriggerClass(variant: TabsVariant) {
  return variant === "underline"
    ? cn(
        "relative -mb-px inline-flex h-12 shrink-0 items-center gap-2 border-b-2 border-transparent type-label text-muted-foreground transition-colors",
        "hover:text-foreground",
        "data-[state=active]:border-primary data-[state=active]:text-foreground aria-[current=page]:border-primary aria-[current=page]:text-foreground",
        "[&_svg]:size-4",
      )
    : cn(
        "inline-flex h-8 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-sm px-4 type-label text-muted-foreground transition-colors",
        "hover:text-foreground",
        "data-[state=active]:bg-muted data-[state=active]:text-foreground",
        "[&_svg]:size-4",
      );
}

