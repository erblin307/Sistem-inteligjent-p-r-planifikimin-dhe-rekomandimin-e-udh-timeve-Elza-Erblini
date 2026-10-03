import { and, desc, eq, inArray } from "drizzle-orm";

import type { Database } from "@/server/db/client";
import { activityCategories, tripInterests, trips } from "@/server/db/schema";
import type { ParsedCreateTripInput } from "@/contracts/trip";
import { dayCount } from "@/contracts/trip";

/**
 * Trip persistence. Every read and write is scoped by the owner's user id;
 * a trip that belongs to someone else is indistinguishable from a missing one.
 */

export type TripRecord = typeof trips.$inferSelect;

export type TripWithDetails = TripRecord & {
  destination: { id: string; slug: string; name: string; timezone: string; currency: string };
  interests: { slug: string; name: string }[];
  /** Derived, never stored. */
  days: number;
  nights: number;
  children: number;
  travelers: number;
};

export class UnknownInterestError extends Error {
  constructor(readonly slugs: string[]) {
    super(`Unknown interest categories: ${slugs.join(", ")}`);
    this.name = "UnknownInterestError";
  }
}

export async function createTrip(
  db: Database,
  userId: string,
  input: ParsedCreateTripInput,
): Promise<TripRecord> {
  return db.transaction(async (tx) => {
    const slugs = [...new Set(input.interests)];
    const categories = await tx
      .select({ id: activityCategories.id, slug: activityCategories.slug })
      .from(activityCategories)
      .where(inArray(activityCategories.slug, slugs));
    if (categories.length !== slugs.length) {
      const known = new Set(categories.map((c) => c.slug));
      throw new UnknownInterestError(slugs.filter((s) => !known.has(s)));
    }

    const [trip] = await tx
      .insert(trips)
      .values({
        userId,
        destinationId: input.destinationId,
        title: input.title,
        startDate: input.startDate,
        endDate: input.endDate,
        departureCity: input.departure?.city,
        departureLatitude: input.departure?.latitude,
        departureLongitude: input.departure?.longitude,
        adults: input.adults,
        childAges: input.childAges,
        budgetMinor: input.budgetMinor,
        currency: input.currency,
        budgetIncludesTransport: input.budgetIncludesTransport,
        travelStyle: input.travelStyle,
        pace: input.pace,
        accommodationType: input.accommodationType,
        minHotelStars: input.minHotelStars,
        localTransportModes: input.localTransportModes,
        inboundTransportMode: input.inboundTransportMode,
        dietaryRequirements: input.dietaryRequirements,
      })
      .returning();
    if (!trip) throw new Error("Trip insert returned no row");

    await tx
      .insert(tripInterests)
      .values(categories.map((c) => ({ tripId: trip.id, categoryId: c.id })));

    return trip;
  });
}

export async function getTripForOwner(
  db: Database,
  userId: string,
  tripId: string,
): Promise<TripWithDetails | null> {
  const row = await db.query.trips.findFirst({
    where: and(eq(trips.id, tripId), eq(trips.userId, userId)),
    with: {
      destination: {
        columns: { id: true, slug: true, name: true, timezone: true, currency: true },
      },
      interests: { with: { category: { columns: { slug: true, name: true } } } },
    },
  });
  if (!row) return null;

  const { interests, destination, ...trip } = row;
  const days = dayCount(trip.startDate, trip.endDate);
  return {
    ...trip,
    destination,
    interests: interests.map((i) => i.category).sort((a, b) => a.slug.localeCompare(b.slug)),
    days,
    nights: days - 1,
    children: trip.childAges.length,
    travelers: trip.adults + trip.childAges.length,
  };
}

export async function listTripsForOwner(db: Database, userId: string) {
  return db.query.trips.findMany({
    where: eq(trips.userId, userId),
    orderBy: [desc(trips.startDate)],
    with: { destination: { columns: { name: true, slug: true } } },
  });
}

export async function deleteTripForOwner(db: Database, userId: string, tripId: string) {
  const deleted = await db
    .delete(trips)
    .where(and(eq(trips.id, tripId), eq(trips.userId, userId)))
    .returning({ id: trips.id });
  return deleted.length > 0;
}
