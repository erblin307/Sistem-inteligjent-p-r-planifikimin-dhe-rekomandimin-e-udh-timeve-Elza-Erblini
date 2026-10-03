"use client";

import { useCssVar } from "./theme-store";

/** Reads the live value of a CSS custom property, so the docs cannot drift. */
export function TokenValue({ name }: { name: string }) {
  const value = useCssVar(name);
  return <span className="font-mono type-caption uppercase text-muted-foreground">{value}</span>;
}
