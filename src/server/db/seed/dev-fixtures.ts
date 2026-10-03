import { eq, inArray, sql } from "drizzle-orm";

import type { Database } from "@/server/db/client";
import {
  activities,
  activityCategories,
  activityOpeningHours,
  amenities,
  destinations,
  hotelAmenities,
  hotels,
} from "@/server/db/schema";
import { activities as fixtureActivities, hotels as fixtureHotels } from "@/lib/fixtures/barcelona";

/**
 * DEVELOPMENT FIXTURES — not travel data.
 *
 * Names and coordinates are real places so maps look right; prices, ratings
 * and review counts are illustrative values from src/lib/fixtures. Every row
 * is written with source = "fixture" so it can never be mistaken for curated
 * or provider data, and can be removed with one statement.
 */

export const FIXTURE_SOURCE = "fixture";

const hotelDetails: Record<string, { lat: number; lng: number; address: string }> = {
  h1: { lat: 41.39857, lng: 2.15927, address: "Passeig de Gràcia 132" },
  h2: { lat: 41.39327, lng: 2.16312, address: "Rambla de Catalunya 27" },
};

const activityDetails: Record<
  string,
  { category: string; lat: number; lng: number; hours: [number, string, string][] }
> = {
  a1: { category: "architecture", lat: 41.39164, lng: 2.16498, hours: everyDay("09:00", "20:00") },
  a2: {
    category: "museums",
    lat: 41.38522,
    lng: 2.18093,
    hours: weekdays([2, 3, 4, 5, 6, 7], "10:00", "19:00"),
  },
  a3: {
    category: "food",
    lat: 41.38168,
    lng: 2.17161,
    hours: weekdays([1, 2, 3, 4, 5, 6], "08:00", "20:30"),
  },
};

const amenitySlug: Record<string, string> = {
  "Breakfast included": "breakfast-included",
  "Free Wi-Fi": "free-wifi",
  "Air conditioning": "air-conditioning",
  "Rooftop terrace": "rooftop-terrace",
  "24-hour reception": "24-hour-reception",
};

export async function seedDevFixtures(db: Database) {
  const [barcelona] = await db
    .insert(destinations)
    .values({
      slug: "barcelona",
      name: "Barcelona",
      countryCode: "ES",
      region: "Catalonia",
      latitude: 41.38879,
      longitude: 2.15899,
      timezone: "Europe/Madrid",
      currency: "EUR",
      source: FIXTURE_SOURCE,
      externalId: "barcelona",
    })
    .onConflictDoUpdate({
      target: destinations.slug,
      set: { name: sql`excluded.name`, updatedAt: sql`now()` },
    })
    .returning({ id: destinations.id });
  if (!barcelona) throw new Error("Destination upsert returned no row");

  const amenityRows = await db.select().from(amenities);
  const amenityId = new Map(amenityRows.map((a) => [a.slug, a.id]));

  for (const h of fixtureHotels) {
    const detail = hotelDetails[h.id];
    if (!detail) throw new Error(`Missing coordinates for fixture hotel ${h.id}`);
    const [row] = await db
      .insert(hotels)
      .values({
        destinationId: barcelona.id,
        name: h.name,
        stars: h.stars,
        area: h.area,
        address: detail.address,
        latitude: detail.lat,
        longitude: detail.lng,
        rating: h.rating,
        reviewCount: h.reviewCount,
        nightlyPriceMinor: h.pricePerNight.amountMinor,
        currency: h.pricePerNight.currency,
        maxOccupancy: 2,
        freeCancellation: h.freeCancellation,
        source: FIXTURE_SOURCE,
        externalId: h.id,
      })
      .onConflictDoUpdate({
        target: [hotels.source, hotels.externalId],
        set: {
          name: sql`excluded.name`,
          rating: sql`excluded.rating`,
          reviewCount: sql`excluded.review_count`,
          nightlyPriceMinor: sql`excluded.nightly_price_minor`,
          updatedAt: sql`now()`,
        },
      })
      .returning({ id: hotels.id });
    if (!row) throw new Error(`Hotel upsert returned no row for ${h.id}`);

    const ids = h.amenities.map((name) => {
      const id = amenityId.get(amenitySlug[name] ?? "");
      if (!id) throw new Error(`Unknown amenity "${name}" on fixture hotel ${h.id}`);
      return id;
    });
    await db.delete(hotelAmenities).where(eq(hotelAmenities.hotelId, row.id));
    await db.insert(hotelAmenities).values(ids.map((amenityId) => ({ hotelId: row.id, amenityId })));
  }

  const categoryRows = await db.select().from(activityCategories);
  const categoryId = new Map(categoryRows.map((c) => [c.slug, c.id]));

  for (const a of fixtureActivities) {
    const detail = activityDetails[a.id];
    if (!detail) throw new Error(`Missing details for fixture activity ${a.id}`);
    const catId = categoryId.get(detail.category);
    if (!catId) throw new Error(`Unknown category "${detail.category}"; run reference seed first`);
    const [row] = await db
      .insert(activities)
      .values({
        destinationId: barcelona.id,
        categoryId: catId,
        name: a.title,
        latitude: detail.lat,
        longitude: detail.lng,
        rating: a.rating,
        reviewCount: a.reviewCount,
        durationMinutes: a.durationMin,
        adultPriceMinor: a.price ? a.price.amountMinor : 0,
        currency: a.price?.currency ?? "EUR",
        source: FIXTURE_SOURCE,
        externalId: a.id,
      })
      .onConflictDoUpdate({
        target: [activities.source, activities.externalId],
        set: {
          name: sql`excluded.name`,
          rating: sql`excluded.rating`,
          reviewCount: sql`excluded.review_count`,
          adultPriceMinor: sql`excluded.adult_price_minor`,
          updatedAt: sql`now()`,
        },
      })
      .returning({ id: activities.id });
    if (!row) throw new Error(`Activity upsert returned no row for ${a.id}`);

    await db.delete(activityOpeningHours).where(eq(activityOpeningHours.activityId, row.id));
    await db.insert(activityOpeningHours).values(
      detail.hours.map(([weekday, opensAt, closesAt]) => ({
        activityId: row.id,
        weekday,
        opensAt,
        closesAt,
      })),
    );
  }
}

/** Removes everything the fixture seed wrote (catalog rows only). */
export async function removeDevFixtures(db: Database) {
  await db.delete(activities).where(eq(activities.source, FIXTURE_SOURCE));
  await db.delete(hotels).where(eq(hotels.source, FIXTURE_SOURCE));
  await db.delete(destinations).where(inArray(destinations.source, [FIXTURE_SOURCE]));
}

function everyDay(opens: string, closes: string): [number, string, string][] {
  return weekdays([1, 2, 3, 4, 5, 6, 7], opens, closes);
}

function weekdays(days: number[], opens: string, closes: string): [number, string, string][] {
  return days.map((d) => [d, opens, closes]);
}
