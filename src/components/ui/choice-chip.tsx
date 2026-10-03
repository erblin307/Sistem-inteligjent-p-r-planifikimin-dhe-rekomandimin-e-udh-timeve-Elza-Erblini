"use client";

import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Multi-select chip backed by a native checkbox, for interests, food and
 * transport preferences. Selected state is shown by fill, border and a check
 * mark, so it never depends on colour alone.
 */
function ChoiceChip({
  label,
  icon,
  checked,
  onCheckedChange,
  disabled,
  name,
  value,
  className,
}: {
  label: string;
  icon?: React.ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  value?: string;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "inline-flex h-10 cursor-pointer select-none items-center gap-2 rounded-md border bg-surface px-4 type-label transition-colors",
        "hover:border-border-strong",
        "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
        "has-[:checked]:border-primary has-[:checked]:bg-primary-subtle has-[:checked]:text-primary-subtle-foreground",
        "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
        "[&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        name={name}
        value={value}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
      {checked ? <Check aria-hidden /> : icon}
      {label}
    </label>
  );
}

export { ChoiceChip };
