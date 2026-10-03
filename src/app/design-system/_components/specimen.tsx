import * as React from "react";

import { cn } from "@/lib/utils";

export function DocSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="flex scroll-mt-8 flex-col gap-8 border-t pt-12">
      <div className="flex max-w-prose flex-col gap-2">
        <h2 id={`${id}-title`} className="type-title">
          {title}
        </h2>
        {description ? <p className="type-reading text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function DocBlock({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex max-w-prose flex-col gap-1">
        <h3 className="type-subheading">{title}</h3>
        {description ? <p className="type-body text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

/** A bordered stage for live components. Surface background, no shadow. */
export function Stage({
  children,
  className,
  tone = "surface",
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "surface" | "canvas";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 md:p-6",
        tone === "surface" ? "bg-surface" : "bg-background",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Rule({ kind, children }: { kind: "do" | "dont"; children: React.ReactNode }) {
  return (
    <li className="flex gap-2 type-body">
      <span
        className={cn(
          "w-12 shrink-0 type-overline",
          kind === "do" ? "text-success" : "text-destructive",
        )}
      >
        {kind === "do" ? "Do" : "Don't"}
      </span>
      <span className="text-foreground">{children}</span>
    </li>
  );
}
