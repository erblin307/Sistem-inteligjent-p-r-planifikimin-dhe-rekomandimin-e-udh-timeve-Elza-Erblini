import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// tailwind-merge needs to know about the custom type roles so that, for
// example, `type-body` and `type-caption` on the same element resolve to the
// last one instead of both being kept.
const twMerge = extendTailwindMerge<"type-role">({
  extend: {
    classGroups: {
      "type-role": [
        {
          type: [
            "title",
            "heading",
            "subheading",
            "body",
            "reading",
            "label",
            "caption",
            "overline",
            "figure",
          ],
        },
      ],
    },
    conflictingClassGroups: {
      "type-role": ["font-size", "font-weight", "leading", "tracking"],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
