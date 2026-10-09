"use client";

import * as React from "react";
import { BedDouble, ImageOff, Landmark, MapPinned, Plane } from "lucide-react";

import type { TravelImage } from "@/contracts/media";
import { cn } from "@/lib/utils";
import { MediaCredit } from "./media-credit";

/** Icon shown when there is no photo. Matches what the frame stands for. */
type FallbackKind = "accommodation" | "place" | "destination" | "transport" | "generic";

const fallbackIcons = {
  accommodation: BedDouble,
  place: Landmark,
  destination: MapPinned,
  transport: Plane,
  generic: ImageOff,
} satisfies Record<FallbackKind, React.ComponentType<{ className?: string }>>;

const ratioClasses = {
  "1/1": "aspect-square",
  "4/3": "aspect-[4/3]",
  "16/9": "aspect-video",
  "3/2": "aspect-[3/2]",
} as const;

/**
 * The single image component. Takes a normalised TravelImage (src/lib/media),
 * never a bare URL, so source and credit always travel with the picture.
 *
 * - The fixed ratio reserves space before the photo loads (no layout shift);
 *   the muted surface is the static loading state.
 * - The photo is cropped with object-cover, never stretched.
 * - No image, or one that fails to load, shows a neutral icon on the muted
 *   surface. It is never swapped for another photo, and a failed URL is not
 *   retried.
 * - `size="thumbnail"` loads the thumbnail rendition and leaves the credit to
 *   the caller (see MediaCredit); card and hero sizes caption it below.
 */
function ImageFrame({
  image,
  ratio = "4/3",
  size = "card",
  fallback = "generic",
  priority = false,
  className,
}: {
  image?: TravelImage | null | undefined;
  ratio?: keyof typeof ratioClasses;
  size?: "thumbnail" | "card" | "hero";
  fallback?: FallbackKind;
  /** Load eagerly. Only for a hero that is visible on first paint. */
  priority?: boolean;
  className?: string;
}) {
  const src = image ? (size === "thumbnail" && image.thumbnailUrl) || image.url : undefined;
  // Keyed by URL: a new image gets a fresh attempt, a failed one is not retried.
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);
  const failed = src !== undefined && failedSrc === src;

  // An error that fires before hydration never reaches onError; catch it here.
  const checkAlreadyFailed = React.useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth === 0) setFailedSrc(img.getAttribute("src"));
  }, []);

  const alt = image?.alt ?? "";
  const Icon = fallbackIcons[fallback];
  const frame = (
    <div className={cn("relative overflow-hidden rounded-md bg-muted", ratioClasses[ratio], className)}>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- see docs/MEDIA.md §5: plain <img> until image hosts are live
        <img
          ref={checkAlreadyFailed}
          src={src}
          alt={alt}
          width={image?.width}
          height={image?.height}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailedSrc(src)}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div
          className="flex size-full items-center justify-center text-subtle-foreground"
          {...(failed && alt
            ? { role: "img", "aria-label": `${alt} (photo unavailable)` }
            : { "aria-hidden": true })}
        >
          <Icon className="size-5" />
        </div>
      )}
    </div>
  );

  if (!image || size === "thumbnail" || failed) return frame;

  return (
    <figure className="flex min-w-0 flex-col gap-1">
      {frame}
      <MediaCredit image={image} as="figcaption" />
    </figure>
  );
}

export { ImageFrame, type FallbackKind };
