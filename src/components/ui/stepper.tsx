import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type Step = { id: string; title: string; description?: string };

/**
 * Multi-step form progress.
 * Desktop/tablet: vertical list with titles. Mobile: "Step 2 of 5" + title.
 */
function Stepper({
  steps,
  current,
  className,
}: {
  steps: Step[];
  current: number;
  className?: string;
}) {
  const active = steps[current];
  return (
    <nav aria-label="Progress" className={className}>
      <p className="type-caption text-muted-foreground md:hidden">
        Step {current + 1} of {steps.length}
        {active ? <span className="text-foreground"> · {active.title}</span> : null}
      </p>
      <ol className="hidden flex-col md:flex">
        {steps.map((step, i) => {
          const state = i < current ? "complete" : i === current ? "current" : "upcoming";
          return (
            <li key={step.id} className="relative flex gap-4 pb-6 last:pb-0">
              {i < steps.length - 1 ? (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-4 top-8 h-[calc(100%-32px)] w-px",
                    state === "complete" ? "bg-primary" : "bg-border",
                  )}
                />
              ) : null}
              <span
                aria-hidden
                className={cn(
                  "relative flex size-8 shrink-0 items-center justify-center rounded-full border type-caption font-medium tabular",
                  state === "complete" && "border-primary bg-primary text-primary-foreground",
                  state === "current" && "border-primary bg-surface text-primary",
                  state === "upcoming" && "bg-surface text-muted-foreground",
                )}
              >
                {state === "complete" ? <Check className="size-4" strokeWidth={2.5} /> : i + 1}
              </span>
              <span className="flex min-w-0 flex-col pt-1">
                <span
                  aria-current={state === "current" ? "step" : undefined}
                  className={cn(
                    "type-label",
                    state === "upcoming" ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {step.title}
                </span>
                {step.description ? (
                  <span className="type-caption text-muted-foreground">{step.description}</span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export { Stepper, type Step };
