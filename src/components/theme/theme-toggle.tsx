"use client";

import { Moon, Sun } from "lucide-react";

import { setTheme, useIsDark } from "@/lib/theme";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const dark = useIsDark();
  const label = dark ? "Switch to light theme" : "Switch to dark theme";

  if (compact) {
    return (
      <Button variant="ghost" size="icon-sm" onClick={() => setTheme(!dark)} aria-label={label}>
        {dark ? <Sun aria-hidden /> : <Moon aria-hidden />}
      </Button>
    );
  }

  return (
    <Button variant="secondary" size="sm" onClick={() => setTheme(!dark)} aria-label={label}>
      {dark ? <Sun aria-hidden /> : <Moon aria-hidden />}
      {dark ? "Light" : "Dark"}
    </Button>
  );
}
