import { z } from "zod";

/**
 * Trip brief contract for POST /api/v1/trips. The plan form maps its state
 * onto it in src/lib/trip-form.ts and validates with it before submitting.
 * Mirrors the database constraints in src/server/db/schema/trips.ts and adds
 * product rules the database does not own (trip length, dates in the future
 * are checked by the API against the destination's time zone).
 */

const isoDate = z.iso.date();
const currency = z.string().regex(/^[A-Z]{3}$/, "Use a three-letter currency code, e.g. EUR.");

export const MAX_TRIP_DAYS = 21;
export const MAX_PARTY_SIZE = 10;

export const travelStyles = ["budget", "balanced", "comfort", "premium"] as const;
export const travelPaces = ["relaxed", "moderate", "packed"] as const;
export const accommodationTypes = ["hotel", "apartment", "hostel", "guesthouse"] as const;
export const localTransportModes = ["walk", "public_transport", "taxi", "car", "bike"] as const;
export const inboundTransportModes = ["flight", "train", "bus", "car"] as const;
export const dietaryRequirements = ["vegetarian", "vegan", "halal", "kosher", "gluten_free"] as const;

export const createTripInput = z
  .object({
    destinationId: z.uuid(),
    title: z.string().trim().min(1).max(120).optional(),
    startDate: isoDate,
    /** Give either endDate (last day of the trip) or days (trip length, ≥ 1). */
    endDate: isoDate.optional(),
    days: z.int().min(1, "A trip lasts at least 1 day.").max(MAX_TRIP_DAYS).optional(),
    departure: z
      .object({
        city: z.string().trim().min(1).max(120),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
      })
      .optional(),
    adults: z.int().min(1, "At least one adult travels.").max(MAX_PARTY_SIZE),
    childAges: z.array(z.int().min(0, "Child ages start at 0.").max(17, "Travelers aged 18 or over count as adults.")).max(MAX_PARTY_SIZE).default([]),
    /** Integer minor units, e.g. 150000 for €1,500. */
    budgetMinor: z
      .int("Send the budget as a whole number of minor units, e.g. 150000 for €1,500.")
      .min(1, "Enter a budget greater than 0.")
      .max(1_000_000_000, "Budgets above 10,000,000 are not supported."),
    currency,
    budgetIncludesTransport: z.boolean().default(true),
    travelStyle: z.enum(travelStyles),
    pace: z.enum(travelPaces).default("moderate"),
    accommodationType: z.enum(accommodationTypes).optional(),
    minHotelStars: z.int().min(1).max(5).optional(),
    localTransportModes: z.array(z.enum(localTransportModes)).min(1, "Choose how you will get around."),
    inboundTransportMode: z.enum(inboundTransportModes).optional(),
    dietaryRequirements: z.array(z.enum(dietaryRequirements)).default([]),
    /** Activity category slugs. */
    interests: z.array(z.string().min(1).max(64)).min(1, "Choose at least one interest.").max(20),
  })
  .superRefine((v, ctx) => {
    if (v.endDate === undefined && v.days === undefined) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "Enter a check-out date or the number of days." });
    }
    if (v.endDate !== undefined && v.days !== undefined && dayCount(v.startDate, v.endDate) !== v.days) {
      ctx.addIssue({
        code: "custom",
        path: ["days"],
        message: "Number of days does not match the dates. Send one or the other.",
      });
    }
    if (v.endDate !== undefined) {
      if (v.endDate < v.startDate) {
        ctx.addIssue({ code: "custom", path: ["endDate"], message: "Check-out must be on or after check-in." });
      } else if (dayCount(v.startDate, v.endDate) > MAX_TRIP_DAYS) {
        ctx.addIssue({ code: "custom", path: ["endDate"], message: `Trips can be at most ${MAX_TRIP_DAYS} days.` });
      }
    }
    if (v.adults + v.childAges.length > MAX_PARTY_SIZE) {
      ctx.addIssue({ code: "custom", path: ["adults"], message: `Plan for at most ${MAX_PARTY_SIZE} travelers.` });
    }
    const d = v.departure;
    if (d && (d.latitude === undefined) !== (d.longitude === undefined)) {
      ctx.addIssue({ code: "custom", path: ["departure"], message: "Provide both latitude and longitude." });
    }
  })
  .transform(({ days, ...v }) => ({
    ...v,
    endDate: v.endDate ?? addDays(v.startDate, (days ?? 1) - 1),
    interests: [...new Set(v.interests)],
  }));

export type CreateTripInput = z.input<typeof createTripInput>;
export type ParsedCreateTripInput = z.output<typeof createTripInput>;

/** "2027-07-12" + 5 → "2027-07-17" (calendar arithmetic in UTC, no time zone drift). */
export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Inclusive day count between two ISO dates (12–17 July = 6 days, 5 nights). */
export function dayCount(startDate: string, endDate: string): number {
  const ms = Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`);
  return Math.round(ms / 86_400_000) + 1;
}

/** Response shapes. Money is { amountMinor, currency }; dates are ISO strings. */

export type Money = { amountMinor: number; currency: string };

export type TripResponse = {
  id: string;
  title: string | null;
  status: "draft" | "planned" | "archived";
  destination: { id: string; slug: string; name: string; timezone: string; currency: string };
  startDate: string;
  endDate: string;
  days: number;
  nights: number;
  travelers: { adults: number; childAges: number[]; total: number };
  departure: { city: string; latitude: number | null; longitude: number | null } | null;
  budget: Money & { includesTransport: boolean };
  preferences: {
    travelStyle: (typeof travelStyles)[number];
    pace: (typeof travelPaces)[number];
    accommodationType: (typeof accommodationTypes)[number] | null;
    minHotelStars: number | null;
    localTransportModes: (typeof localTransportModes)[number][];
    inboundTransportMode: (typeof inboundTransportModes)[number] | null;
    dietaryRequirements: (typeof dietaryRequirements)[number][];
    interests: { slug: string; name: string }[];
  };
  createdAt: string;
  updatedAt: string;
};

export type TripSummaryResponse = Pick<
  TripResponse,
  "id" | "title" | "status" | "startDate" | "endDate" | "days" | "budget"
> & {
  destination: { slug: string; name: string };
  travelers: { total: number };
};
