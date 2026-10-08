"use client";

import * as React from "react";

import { THEME_STORAGE_KEY } from "./theme-script";

/** Theme state for client components. See ./theme-script for the bootstrap. */

const EVENT = "themechange";

export function subscribeToTheme(callback: () => void) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}

export function setTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
  } catch {
    // Storage can be unavailable (private mode); the theme still applies for this page.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useIsDark() {
  return React.useSyncExternalStore(
    subscribeToTheme,
    () => document.documentElement.classList.contains("dark"),
    () => false,
  );
}
