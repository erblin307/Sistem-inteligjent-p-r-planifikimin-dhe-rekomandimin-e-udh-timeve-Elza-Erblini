"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { setTheme, useIsDark } from "./theme-store";

export function ThemeToggle() {
  const dark = useIsDark();
  return (
    <Button variant="secondary" size="sm" onClick={() => setTheme(!dark)} aria-pressed={dark}>
      {dark ? <Sun aria-hidden /> : <Moon aria-hidden />}
      {dark ? "Light" : "Dark"}
    </Button>
  );
}
