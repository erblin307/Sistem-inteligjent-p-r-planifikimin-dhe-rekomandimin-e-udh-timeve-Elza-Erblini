import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md",
    "type-label transition-colors select-none",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        /** One per view: the action that moves the task forward. */
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        /** Everything else that is a real action. */
        secondary:
          "border border-input bg-surface text-foreground hover:bg-accent",
        /** Toolbar and inline actions where a border would add noise. */
        ghost: "text-foreground hover:bg-accent",
        /** Text-weight action inside running content. */
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline",
        destructive:
          "border border-input bg-surface text-destructive hover:bg-destructive-subtle",
      },
      size: {
        sm: "h-8 px-2",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    compoundVariants: [{ variant: "link", className: "h-auto px-0" }],
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
