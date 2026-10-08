import { asc, eq } from "drizzle-orm";

import type { Database } from "@/server/db/client";
import { activities, activityCategories, destinations, hotels } from "@/server/db/schema";

/** Catalog reads for one destination: the engine's candidate pool. */

export async function findDestinationCentre(db: Database, destinationId: string) {
  const [row] = await db
    .select({ latitude: destinations.latitude, longitude: destinations.longitude })
    .from(destinations)
    .where(eq(destinations.id, destinationId))
    .limit(1);
  return row ?? null;
}

export async function listHotelCandidates(db: Database, destinationId: string) {
  return db.query.hotels.findMany({
    where: eq(hotels.destinationId, destinationId),
    orderBy: [asc(hotels.name)],
    with: { amenities: { with: { amenity: { columns: { name: true } } } } },
  });
}

export async function listActivityCandidates(db: Database, destinationId: string) {
  return db
    .select({
      id: activities.id,
      name: activities.name,
      latitude: activities.latitude,
      longitude: activities.longitude,
      rating: activities.rating,
      reviewCount: activities.reviewCount,
      durationMinutes: activities.durationMinutes,
      adultPriceMinor: activities.adultPriceMinor,
      currency: activities.currency,
      imageUrl: activities.imageUrl,
      source: activities.source,
      categorySlug: activityCategories.slug,
      categoryName: activityCategories.name,
    })
    .from(activities)
    .innerJoin(activityCategories, eq(activityCategories.id, activities.categoryId))
    .where(eq(activities.destinationId, destinationId))
    .orderBy(asc(activities.name));
}
