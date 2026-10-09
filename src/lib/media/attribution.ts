import type { TravelImage } from "@/contracts/media";
import { imageSources } from "./sources";

/** One run of credit text, linked when the source gave a URL. */
export type CreditPart = { text: string; href?: string };

export type ImageCredit = {
  /** e.g. "Photo by Ana Ruiz on Pexels" or "Photo: Jane Doe / Wikimedia Commons". */
  parts: CreditPart[];
  /** As the source states it, e.g. "CC BY-SA 4.0". */
  license?: CreditPart;
};

/**
 * The visible credit for an image, in the wording each source asks for.
 * Null when the image needs no credit (the team's own files).
 * Cards never write credit text themselves; they render this.
 */
export function imageCredit(image: TravelImage): ImageCredit | null {
  const a = image.attribution;
  const policy = imageSources[image.source];
  if (!a || (policy.attribution === "none" && !a.authorName)) return null;

  const author: CreditPart | null = a.authorName ? link(a.authorName, a.authorUrl) : null;
  const source = link(a.sourceName ?? policy.name, a.sourceUrl);

  let parts: CreditPart[];
  if (image.source === "local" && author) {
    parts = [{ text: "Photo: " }, author];
  } else if ((image.source === "pexels" || image.source === "unsplash") && author) {
    parts = [{ text: "Photo by " }, author, { text: " on " }, source];
  } else if (author) {
    parts = [{ text: "Photo: " }, author, { text: " / " }, source];
  } else {
    parts = [{ text: "Photo: " }, source];
  }

  return {
    parts,
    ...(a.license ? { license: link(a.license, a.licenseUrl) } : {}),
  };
}

/** Plain-text form, for titles and tests. */
export function imageCreditText(credit: ImageCredit): string {
  const line = credit.parts.map((p) => p.text).join("");
  return credit.license ? `${line} · ${credit.license.text}` : line;
}

function link(text: string, href: string | undefined): CreditPart {
  return href ? { text, href } : { text };
}
