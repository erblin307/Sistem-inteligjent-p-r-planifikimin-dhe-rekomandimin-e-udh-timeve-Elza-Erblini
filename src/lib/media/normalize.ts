import {
  type TravelImage,
  type TravelImageAttribution,
  type TravelImageSubject,
  travelImageSchema,
} from "@/contracts/media";
import { type ImageSourcePolicy, imageSources } from "./sources";

/**
 * Turns untrusted image data (a provider adapter's output, a catalog column)
 * into a TravelImage, or null. Null means "show the fallback": invalid
 * metadata never reaches an <img>.
 */
export function normalizeTravelImage(input: unknown): TravelImage | null {
  const parsed = travelImageSchema.safeParse(input);
  if (!parsed.success) return null;
  const image = parsed.data;
  const policy = imageSources[image.source];

  if (!policy.subjects.includes(image.subject)) return null;
  if (image.alt !== "" && isMeaninglessAlt(image.alt)) return null;

  const url = safeImageUrl(image.url, policy);
  if (!url) return null;
  const thumbnailUrl = image.thumbnailUrl ? safeImageUrl(image.thumbnailUrl, policy) : null;

  const attribution = cleanAttribution(image.attribution, policy);
  if (policy.requiresLicense && !attribution?.license) return null;

  const hasSize = image.width !== undefined && image.height !== undefined;

  return {
    ...(image.id ? { id: image.id } : {}),
    url,
    ...(thumbnailUrl ? { thumbnailUrl } : {}),
    alt: image.alt,
    ...(hasSize ? { width: image.width, height: image.height } : {}),
    source: image.source,
    subject: image.subject,
    ...(attribution ? { attribution } : {}),
    ...(image.metadata ? { metadata: image.metadata } : {}),
  };
}

/**
 * Reads a catalog `image_url` column. The column has no source or licence,
 * so only files served by this app are accepted (as `local`); an external
 * URL there has unknown provenance and is ignored.
 */
export function catalogImage(
  imageUrl: string | null,
  { alt, subject }: { alt: string; subject: TravelImageSubject },
): TravelImage | null {
  if (!imageUrl) return null;
  return normalizeTravelImage({ url: imageUrl, alt, source: "local", subject });
}

const RELATIVE_BASE = "https://same-origin.invalid";

/**
 * An image file URL the browser may load for this source: https on an
 * allowed host, or a same-origin path when the source is served through this
 * app. Anything else (http, data:, javascript:, credentials, other hosts) is
 * refused.
 */
export function safeImageUrl(raw: string, policy: ImageSourcePolicy): string | null {
  const value = raw.trim();
  if (!value || value.length > 2048 || /[\s\\]/.test(value)) return null;

  if (value.startsWith("/")) {
    if (!policy.sameOrigin || value.startsWith("//")) return null;
    const url = parseUrl(value, RELATIVE_BASE);
    if (!url || url.origin !== RELATIVE_BASE) return null;
    return url.pathname + url.search;
  }

  const url = parseUrl(value);
  if (!url || url.protocol !== "https:" || url.username || url.password || url.port) return null;
  if (!policy.hosts.some((host) => hostMatches(url.hostname, host))) return null;
  return url.toString();
}

/** An attribution link: any https page without credentials. */
export function safeLinkUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const url = parseUrl(raw.trim());
  if (!url || url.protocol !== "https:" || url.username || url.password) return undefined;
  return url.toString();
}

function cleanAttribution(
  attribution: TravelImageAttribution | undefined,
  policy: ImageSourcePolicy,
): TravelImageAttribution | undefined {
  if (!attribution && policy.attribution === "none") return undefined;
  const a = attribution ?? {};
  const clean: TravelImageAttribution = {
    authorName: a.authorName,
    authorUrl: safeLinkUrl(a.authorUrl),
    sourceName: a.sourceName ?? policy.name,
    sourceUrl: safeLinkUrl(a.sourceUrl),
    license: a.license,
    licenseUrl: safeLinkUrl(a.licenseUrl),
  };
  return Object.fromEntries(
    Object.entries(clean).filter(([, v]) => v !== undefined),
  ) as TravelImageAttribution;
}

/** "image", "photo 3", "IMG_2041.jpg": alt text that tells the reader nothing. */
function isMeaninglessAlt(alt: string): boolean {
  const a = alt.trim().toLowerCase();
  return (
    /^(image|img|photo|picture|pic|untitled|thumbnail)?[\s._-]*\d*(\.(jpe?g|png|webp|gif|avif))?$/.test(a) ||
    /^(img|dsc|dscn|pxl)[_-]?\d+(\.(jpe?g|png|webp|heic))?$/.test(a)
  );
}

function hostMatches(hostname: string, allowed: string): boolean {
  return allowed.startsWith(".")
    ? hostname.endsWith(allowed) && hostname.length > allowed.length
    : hostname === allowed;
}

function parseUrl(value: string, base?: string): URL | null {
  try {
    return new URL(value, base);
  } catch {
    return null;
  }
}
