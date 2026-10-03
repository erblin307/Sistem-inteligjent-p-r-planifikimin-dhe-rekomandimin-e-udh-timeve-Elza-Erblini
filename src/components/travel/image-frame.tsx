import * as React from "react";
import { ImageOff } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Fixed-ratio media frame. Keeps layout stable while images load and shows a
 * quiet placeholder when there is no image, so lists never collapse.
 */
function ImageFrame({
  src,
  alt,
  ratio = "4/3",
  className,
}: {
  src?: string | undefined;
  alt: string;
  ratio?: "1/1" | "4/3" | "16/9" | "3/2";
  className?: string;
}) {
  const ratioClass = {
    "1/1": "aspect-square",
    "4/3": "aspect-[4/3]",
    "16/9": "aspect-video",
    "3/2": "aspect-[3/2]",
  }[ratio];

  return (
    <div className={cn("relative overflow-hidden rounded-md bg-muted", ratioClass, className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- next/image is wired in once image hosts are decided
        <img src={src} alt={alt} className="size-full object-cover" loading="lazy" />
      ) : (
        <div className="flex size-full items-center justify-center text-subtle-foreground">
          <ImageOff aria-hidden className="size-5" />
          <span className="sr-only">{alt}</span>
        </div>
      )}
    </div>
  );
}

export { ImageFrame };
