import type { TravelImageSource, TravelImageSubject } from "@/contracts/media";

/**
 * What the product may show from each image source, and where. Pure data,
 * safe on the client. Provider calls themselves live behind the server port
 * in src/server/integrations/media. See docs/MEDIA.md.
 *
 * Only approved provider APIs appear here. Scraped images (Google Images
 * results, blogs, Pinterest, hotel websites) have no source key and are
 * never accepted. Google Places Photos is the Places API, not Google Images.
 */

/** Where an image is shown. Each slot accepts its own sources, in preference order. */
export type ImageSlot =
  /** A specific hotel, apartment or hostel. */
  | "accommodation"
  /** A specific real place: landmark, museum, attraction, restaurant, park. */
  | "place"
  /** A city or region as context: hero, saved-trip preview, explore. */
  | "destination"
  /** Generic travel by air, rail, bus or road. Never a specific flight. */
  | "transport";

export type ImageSourcePolicy = {
  /** Display name used in attribution. */
  name: string;
  /**
   * Hosts the image files may be served from. A leading dot allows
   * subdomains. Empty = files only from this app (`/…` paths), which is how
   * keyed providers are served: through a server route that adds the key.
   */
  hosts: readonly string[];
  /** Same-origin paths are accepted (local files or a server proxy route). */
  sameOrigin: boolean;
  subjects: readonly TravelImageSubject[];
  /** Visible credit: required by the source's terms, or not needed. */
  attribution: "required" | "none";
  /** A licence must be known before the image may be shown. */
  requiresLicense: boolean;
};

export const imageSources: Record<TravelImageSource, ImageSourcePolicy> = {
  booking: {
    name: "Booking.com",
    // To be confirmed against the Demand API contract when it is integrated.
    hosts: [".bstatic.com"],
    sameOrigin: true,
    subjects: ["entity"],
    attribution: "required",
    requiresLicense: false,
  },
  expedia: {
    name: "Expedia",
    // To be confirmed against the Rapid API contract when it is integrated.
    hosts: [".trvl-media.com"],
    sameOrigin: true,
    subjects: ["entity"],
    attribution: "required",
    requiresLicense: false,
  },
  google_places: {
    name: "Google Maps",
    // Place Photos needs the API key, so the server resolves the photo and
    // the browser gets either a proxied path or the short-lived photoUri.
    hosts: [".googleusercontent.com"],
    sameOrigin: true,
    subjects: ["entity"],
    attribution: "required",
    requiresLicense: false,
  },
  wikimedia: {
    name: "Wikimedia Commons",
    hosts: ["upload.wikimedia.org"],
    sameOrigin: false,
    subjects: ["entity", "context"],
    attribution: "required",
    requiresLicense: true,
  },
  pexels: {
    name: "Pexels",
    hosts: ["images.pexels.com"],
    sameOrigin: false,
    subjects: ["context"],
    attribution: "required",
    requiresLicense: false,
  },
  unsplash: {
    name: "Unsplash",
    hosts: ["images.unsplash.com"],
    sameOrigin: false,
    subjects: ["context"],
    attribution: "required",
    requiresLicense: false,
  },
  local: {
    name: "Itinera",
    // Files the team owns or licensed, served from this app.
    hosts: [],
    sameOrigin: true,
    subjects: ["entity", "context"],
    attribution: "none",
    requiresLicense: false,
  },
};

/**
 * Accepted sources per slot, most preferred first. A named hotel or place
 * only ever shows a photo of itself; when there is none it shows the neutral
 * fallback, never stock imagery.
 */
export const slotSources: Record<ImageSlot, { subject: TravelImageSubject; sources: readonly TravelImageSource[] }> = {
  accommodation: { subject: "entity", sources: ["booking", "expedia", "local"] },
  place: { subject: "entity", sources: ["google_places", "wikimedia", "local"] },
  destination: { subject: "context", sources: ["pexels", "unsplash", "wikimedia", "local"] },
  transport: { subject: "context", sources: ["pexels", "unsplash", "local"] },
};
