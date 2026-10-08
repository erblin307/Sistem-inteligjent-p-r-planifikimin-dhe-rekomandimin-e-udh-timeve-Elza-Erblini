"use client";

import * as React from "react";

import { subscribeToTheme } from "@/lib/theme";

/** Live value of a CSS custom property; re-reads when the theme changes. */
export function useCssVar(name: string) {
  return React.useSyncExternalStore(
    subscribeToTheme,
    () => getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
    () => "",
  );
}
