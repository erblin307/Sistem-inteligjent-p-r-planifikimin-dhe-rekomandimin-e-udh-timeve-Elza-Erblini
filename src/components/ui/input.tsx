import * as React from "react";

import { cn } from "@/lib/utils";

const fieldBase = [
  "w-full min-w-0 rounded-md border border-input bg-surface text-foreground type-body",
  "placeholder:text-subtle-foreground",
  "transition-colors hover:border-subtle-foreground",
  "focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20",
  "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground",
  "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20",
];

function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(fieldBase, "h-10 px-4", className)}
      {...props}
    />
  );
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldBase, "min-h-24 px-4 py-2", className)}
      {...props}
    />
  );
}

/** Input with a leading icon or unit, e.g. a search field or "€" prefix. */
function InputGroup({
  leading,
  trailing,
  className,
  ...props
}: React.ComponentProps<"input"> & {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="relative">
      {leading ? (
        <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-muted-foreground [&_svg]:size-4">
          {leading}
        </span>
      ) : null}
      <Input
        className={cn(leading && "pl-10", trailing && "pr-14", className)}
        {...props}
      />
      {trailing ? (
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground type-body">
          {trailing}
        </span>
      ) : null}
    </div>
  );
}

export { Input, Textarea, InputGroup, fieldBase };
