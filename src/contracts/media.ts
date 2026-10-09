import { z } from "zod";

/**
 * The one image shape the product renders. Every photo, whatever provider it
 * came from, is normalised into a TravelImage by `normalizeTravelImage`
 * (src/lib/media) before it reaches a component. See docs/MEDIA.md.
 *
 * No component takes a bare image URL: the source, the subject and the
 * attribution travel with the picture.
 */

export const travelImageSources = [
  "booking",
  "expedia",
  "google_places",
  "wikimedia",
  "pexels",
  "unsplash",
  "local",
] as const;

export type TravelImageSource = (typeof travelImageSources)[number];

/**
 * What the photo shows.
 * - `entity`: this specific hotel or place (a provider returned it for that
 *   property or place id).
 * - `context`: the destination or travel in general. Never shown as if it
 *   were a specific hotel, place or flight.
 */
export const travelImageSubjects = ["entity", "context"] as const;

export type TravelImageSubject = (typeof travelImageSubjects)[number];

const optionalText = z.string().trim().min(1).max(500).optional();

export const travelImageAttributionSchema = z.object({
  authorName: optionalText,
  authorUrl: optionalText,
  /** Display name of the source, e.g. "Wikimedia Commons". Filled from the source registry when absent. */
  sourceName: optionalText,
  /** The photo's page at the source (not the image file). */
  sourceUrl: optionalText,
  /** As the source states it, e.g. "CC BY-SA 4.0". Never shortened. */
  license: optionalText,
  licenseUrl: optionalText,
});

export type TravelImageAttribution = z.output<typeof travelImageAttributionSchema>;

export const travelImageSchema = z.object({
  id: optionalText,
  /** Display-size rendition (about 1200px wide at most), not the original upload. */
  url: z.string().min(1).max(2048),
  /** Small rendition (about 400px wide) for list thumbnails. */
  thumbnailUrl: z.string().min(1).max(2048).optional(),
  /** Describes the photo, e.g. "Colosseum in Rome". Empty only for decorative images. */
  alt: z.string().trim().max(300),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  source: z.enum(travelImageSources),
  subject: z.enum(travelImageSubjects),
  attribution: travelImageAttributionSchema.optional(),
  metadata: z
    .object({
      placeId: optionalText,
      propertyId: optionalText,
      providerPhotoId: optionalText,
    })
    .optional(),
});

export type TravelImage = z.output<typeof travelImageSchema>;
