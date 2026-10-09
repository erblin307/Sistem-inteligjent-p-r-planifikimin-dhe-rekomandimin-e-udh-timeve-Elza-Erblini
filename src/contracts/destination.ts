import { z } from "zod";

import type { TravelImage } from "./media";
import type { Money } from "./trip";

/** Query string → filters for GET /api/v1/destinations. */

const slugList = z
  .union([z.string(), z.array(z.string())])
  .transform((v) => (Array.isArray(v) ? v : v.split(",")))
  .pipe(
    z
      .array(z.string().trim().toLowerCase().min(1).max(64))
      .max(10, "Filter by at most 10 values at a time."),
  )
  .transform((v) => [...new Set(v)]);

export const listDestinationsQuery = z
  .object({
    /** Free-text search over name, region and country code. */
    q: z.string().trim().min(1).max(80).optional(),
    /** ISO 3166-1 alpha-2, e.g. ES. */
    country: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, "Use a two-letter country code, e.g. ES.")
      .optional(),
    /** Exact city name, case-insensitive. */
    city: z.string().trim().min(1).max(80).optional(),
    /** Activity category slugs; the destination must offer all of them. */
    interest: slugList.optional(),
    /** At least one hotel with this many stars or more… */
    minStars: z.coerce.number().int().min(1).max(5).optional(),
    /** …that also has every one of these amenities… */
    amenity: slugList.optional(),
    /** …and costs at most this per night (minor units, in `currency`). */
    maxNightlyPriceMinor: z.coerce.number().int().min(0).max(100_000_000).optional(),
    currency: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{3}$/, "Use a three-letter currency code, e.g. EUR.")
      .optional(),
    cursor: z.string().max(512).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .superRefine((v, ctx) => {
    if (v.maxNightlyPriceMinor !== undefined && !v.currency) {
      ctx.addIssue({
        code: "custom",
        path: ["currency"],
        message: "Add a currency when filtering by price. Prices are not converted between currencies yet.",
      });
    }
  });

export type ListDestinationsQuery = z.output<typeof listDestinationsQuery>;

export type DestinationSummaryResponse = {
  id: string;
  slug: string;
  name: string;
  countryCode: string;
  region: string | null;
  latitude: number;
  longitude: number;
  timezone: string;
  currency: string;
  /** Destination context photo (not of a specific place), or null. */
  image: TravelImage | null;
  hotels: {
    count: number;
    /** Lowest and median typical nightly rate, in the destination currency. */
    nightlyFrom: Money | null;
    nightlyMedian: Money | null;
  };
  activities: { count: number; categories: string[] };
};

export type DestinationResponse = Omit<DestinationSummaryResponse, "activities"> & {
  activities: {
    count: number;
    categories: { slug: string; name: string; count: number }[];
  };
};

export type ListDestinationsResponse = {
  items: DestinationSummaryResponse[];
  nextCursor: string | null;
};
