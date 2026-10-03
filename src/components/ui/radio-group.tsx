"use client";

import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-2", className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "peer flex size-5 shrink-0 items-center justify-center rounded-full border border-input bg-surface transition-colors",
        "hover:border-subtle-foreground data-[state=checked]:border-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="size-2 rounded-full bg-primary" />
    </RadioGroupPrimitive.Item>
  );
}

/**
 * A selectable option with a title and description, used for choices that
 * need explanation (accommodation type, travel pace). The whole row is the
 * hit target.
 */
function RadioOption({
  value,
  title,
  description,
  meta,
  className,
}: {
  value: string;
  title: string;
  description?: string;
  meta?: React.ReactNode;
  className?: string;
}) {
  const id = React.useId();
  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-4 rounded-md border bg-surface p-4 transition-colors",
        "hover:border-border-strong has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary-subtle",
        className,
      )}
    >
      <RadioGroupItem id={id} value={value} className="mt-px" />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="type-label">{title}</span>
        {description ? (
          <span className="type-body text-muted-foreground">{description}</span>
        ) : null}
      </span>
      {meta ? <span className="type-body text-muted-foreground tabular">{meta}</span> : null}
    </label>
  );
}

export { RadioGroup, RadioGroupItem, RadioOption };
