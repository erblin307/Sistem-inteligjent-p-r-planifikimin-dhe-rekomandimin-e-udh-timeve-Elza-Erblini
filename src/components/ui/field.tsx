"use client";

import * as React from "react";
import { CircleAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { Label } from "./label";

/**
 * Field wires a label, optional hint and error message to a single control.
 * The control receives id, aria-describedby and aria-invalid automatically
 * when it is the only child, so a field can never ship without a label.
 */

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  className?: string;
  children: React.ReactElement<Record<string, unknown>>;
};

function Field({ label, hint, error, optional, className, children }: FieldProps) {
  const autoId = React.useId();
  const id = (children.props.id as string | undefined) ?? autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div data-slot="field" className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>
        {label}
        {optional ? (
          <span className="ml-1 font-normal text-muted-foreground">(optional)</span>
        ) : null}
      </Label>
      {React.cloneElement(children, {
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}
      {hint && !error ? (
        <p id={hintId} className="type-caption text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="flex items-start gap-1 type-caption text-destructive">
          <CircleAlert aria-hidden className="mt-px size-4 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Groups related controls (radio sets, chip sets) under one legend. */
function Fieldset({
  legend,
  hint,
  error,
  className,
  children,
}: {
  legend: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset
      className={cn("flex min-w-0 flex-col gap-4", className)}
      aria-invalid={error ? true : undefined}
    >
      <div className="flex flex-col gap-1">
        <legend className="type-label text-foreground">{legend}</legend>
        {hint ? <p className="type-caption text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
      {error ? (
        <p className="flex items-start gap-1 type-caption text-destructive">
          <CircleAlert aria-hidden className="mt-px size-4 shrink-0" />
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export { Field, Fieldset };
