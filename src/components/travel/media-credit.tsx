import * as React from "react";

import type { TravelImage } from "@/contracts/media";
import { imageCredit } from "@/lib/media";
import { cn } from "@/lib/utils";

/**
 * Photo credit in the wording the source asks for ("Photo by … on Pexels",
 * "Photo: … / Wikimedia Commons · CC BY-SA 4.0"). Secondary caption text,
 * never an overlay. Renders nothing for images that need no credit.
 *
 * ImageFrame shows it under card and hero images. Where a thumbnail is too
 * small for a caption, render it in the item's details instead: a required
 * credit is moved, never dropped.
 */
function MediaCredit({
  image,
  as: Tag = "p",
  className,
}: {
  image: TravelImage;
  as?: "p" | "figcaption";
  className?: string;
}) {
  const credit = imageCredit(image);
  if (!credit) return null;

  return (
    <Tag className={cn("type-caption text-muted-foreground", className)}>
      {credit.parts.map((part, i) => (
        <CreditText key={i} {...part} />
      ))}
      {credit.license ? (
        <>
          {" · "}
          <CreditText {...credit.license} />
        </>
      ) : null}
    </Tag>
  );
}

function CreditText({ text, href }: { text: string; href?: string | undefined }) {
  if (!href) return <>{text}</>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 hover:text-foreground"
    >
      {text}
    </a>
  );
}

export { MediaCredit };
