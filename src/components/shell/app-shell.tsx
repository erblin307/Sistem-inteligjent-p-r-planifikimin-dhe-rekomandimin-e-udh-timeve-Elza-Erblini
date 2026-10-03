"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, CircleUser, House, Luggage, Route } from "lucide-react";

import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Application frame. Three separate layouts:
 * - Desktop (≥1280): 240px sidebar with labels.
 * - Tablet (768–1279): 64px icon rail, labels in tooltips.
 * - Mobile (<768): top bar with the product name, bottom tab bar.
 */

const nav = [
  { href: "/overview", label: "Overview", icon: House },
  { href: "/plan", label: "Plan a Trip", icon: Route },
  { href: "/trips", label: "My Trips", icon: Luggage },
  { href: "/saved", label: "Saved Places", icon: Bookmark },
  { href: "/profile", label: "Profile", icon: CircleUser },
] as const;

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/overview" className="flex items-center gap-2 rounded-sm type-subheading">
      <span
        aria-hidden
        className="flex size-6 items-center justify-center rounded-sm bg-primary type-caption font-semibold text-primary-foreground"
      >
        i
      </span>
      <span className={cn(compact && "sr-only")}>Itinera</span>
    </Link>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-dvh md:pl-16 xl:pl-60">
        {/* Tablet rail + desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-16 flex-col border-r bg-background md:flex xl:w-60">
          <div className="flex h-16 items-center justify-center xl:justify-start xl:px-6">
            <span className="xl:hidden">
              <Wordmark compact />
            </span>
            <span className="hidden xl:block">
              <Wordmark />
            </span>
          </div>
          <nav aria-label="Main" className="flex flex-col gap-1 px-2 xl:px-4">
            {nav.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              const link = (
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-10 items-center gap-4 rounded-md type-label transition-colors",
                    "justify-center xl:justify-start xl:px-4",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon aria-hidden className="size-5 shrink-0" strokeWidth={1.75} />
                  <span className="sr-only xl:not-sr-only">{item.label}</span>
                </Link>
              );
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right" className="xl:hidden">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
        </aside>

        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center border-b bg-background px-4 md:hidden">
          <Wordmark />
        </header>

        <main className="pb-24 md:pb-0">{children}</main>

        {/* Mobile bottom tab bar */}
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-surface pb-safe md:hidden"
        >
          {nav.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-1 type-caption",
                  active ? "font-medium text-primary" : "text-muted-foreground",
                )}
              >
                <Icon aria-hidden className="size-5" strokeWidth={active ? 2 : 1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </TooltipProvider>
  );
}

/** Standard page padding: 16 mobile, 24 tablet, 32 desktop. */
function PageContainer({
  children,
  width = "content",
  className,
}: {
  children: React.ReactNode;
  width?: "content" | "wide" | "form";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-6 md:px-6 md:py-8 xl:px-8",
        width === "content" && "max-w-content",
        width === "wide" && "max-w-wide",
        width === "form" && "max-w-form",
        className,
      )}
    >
      {children}
    </div>
  );
}

export { AppShell, PageContainer, Wordmark, nav as appNavigation };
