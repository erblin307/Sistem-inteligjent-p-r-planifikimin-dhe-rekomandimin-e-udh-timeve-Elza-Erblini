import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  char,
  check,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  time,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { coordinates, currencyCode, id, minorUnits, provenance, timestamps } from "./columns";
import { accommodationType } from "./enums";

/*
 * Catalog: shared reference data. Trips and plans point at these rows and
 * never copy or delete them. Ratings and review counts are provider ratings
 * (0–5 scale); the product has no user reviews yet.
 */

export const destinations = pgTable(
  "destinations",
  {
    id: id(),
    slug: text().notNull().unique(),
    name: text().notNull(),
    countryCode: char({ length: 2 }).notNull(),
    region: text(),
    ...coordinates,
    /** IANA zone, e.g. "Europe/Madrid". Itinerary times are local to it. */
    timezone: text().notNull(),
    currency: currencyCode().notNull(),
    imageUrl: text(),
    isActive: boolean().notNull().default(true),
    ...provenance,
    ...timestamps,
  },
  (t) => [
    unique("destinations_source_external_id_key").on(t.source, t.externalId),
    check("destinations_country_code_format", sql`${t.countryCode} ~ '^[A-Z]{2}$'`),
    check("destinations_currency_format", sql`${t.currency} ~ '^[A-Z]{3}$'`),
    ...coordinateChecks("destinations", t),
  ],
);

export const hotels = pgTable(
  "hotels",
  {
    id: id(),
    destinationId: uuid()
      .notNull()
      .references(() => destinations.id, { onDelete: "restrict" }),
    name: text().notNull(),
    description: text(),
    propertyType: accommodationType().notNull().default("hotel"),
    /** Official class. Null for unclassified properties such as apartments. */
    stars: smallint(),
    area: text(),
    address: text(),
    ...coordinates,
    rating: numeric({ precision: 2, scale: 1, mode: "number" }),
    reviewCount: integer().notNull().default(0),
    /** Typical nightly rate for one room, used until live rates exist. */
    nightlyPriceMinor: minorUnits(),
    currency: currencyCode().notNull(),
    maxOccupancy: smallint().notNull().default(2),
    freeCancellation: boolean(),
    imageUrl: text(),
    ...provenance,
    ...timestamps,
  },
  (t) => [
    unique("hotels_source_external_id_key").on(t.source, t.externalId),
    // Every hotel query is scoped to one destination.
    index("hotels_destination_id_idx").on(t.destinationId),
    check("hotels_stars_range", sql`${t.stars} BETWEEN 1 AND 5`),
    check("hotels_rating_range", sql`${t.rating} BETWEEN 0 AND 5`),
    check("hotels_review_count_nonnegative", sql`${t.reviewCount} >= 0`),
    check("hotels_nightly_price_nonnegative", sql`${t.nightlyPriceMinor} >= 0`),
    check("hotels_max_occupancy_positive", sql`${t.maxOccupancy} >= 1`),
    check("hotels_currency_format", sql`${t.currency} ~ '^[A-Z]{3}$'`),
    ...coordinateChecks("hotels", t),
  ],
);

export const amenities = pgTable("amenities", {
  id: id(),
  slug: text().notNull().unique(),
  name: text().notNull(),
});

export const hotelAmenities = pgTable(
  "hotel_amenities",
  {
    hotelId: uuid()
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    amenityId: uuid()
      .notNull()
      .references(() => amenities.id, { onDelete: "restrict" }),
  },
  (t) => [
    primaryKey({ columns: [t.hotelId, t.amenityId] }),
    // "Hotels with breakfast / free cancellation" filters start from the amenity.
    index("hotel_amenities_amenity_id_idx").on(t.amenityId),
  ],
);

/** The single interest taxonomy: used by activities and by trip interests. */
export const activityCategories = pgTable("activity_categories", {
  id: id(),
  slug: text().notNull().unique(),
  name: text().notNull(),
});

export const activities = pgTable(
  "activities",
  {
    id: id(),
    destinationId: uuid()
      .notNull()
      .references(() => destinations.id, { onDelete: "restrict" }),
    categoryId: uuid()
      .notNull()
      .references(() => activityCategories.id, { onDelete: "restrict" }),
    name: text().notNull(),
    description: text(),
    address: text(),
    ...coordinates,
    rating: numeric({ precision: 2, scale: 1, mode: "number" }),
    reviewCount: integer().notNull().default(0),
    durationMinutes: smallint().notNull(),
    /** Per person. 0 = free entry; null = price not known. */
    adultPriceMinor: minorUnits(),
    /** Null = children pay the adult price (or it is not known). */
    childPriceMinor: minorUnits(),
    currency: currencyCode().notNull(),
    minAge: smallint(),
    bookingRequired: boolean().notNull().default(false),
    imageUrl: text(),
    ...provenance,
    ...timestamps,
  },
  (t) => [
    unique("activities_source_external_id_key").on(t.source, t.externalId),
    // Candidate loading: by destination, optionally filtered by category.
    index("activities_destination_id_category_id_idx").on(t.destinationId, t.categoryId),
    check("activities_rating_range", sql`${t.rating} BETWEEN 0 AND 5`),
    check("activities_review_count_nonnegative", sql`${t.reviewCount} >= 0`),
    check("activities_duration_positive", sql`${t.durationMinutes} > 0`),
    check("activities_adult_price_nonnegative", sql`${t.adultPriceMinor} >= 0`),
    check("activities_child_price_nonnegative", sql`${t.childPriceMinor} >= 0`),
    check("activities_min_age_range", sql`${t.minAge} BETWEEN 0 AND 17`),
    check("activities_currency_format", sql`${t.currency} ~ '^[A-Z]{3}$'`),
    ...coordinateChecks("activities", t),
  ],
);

/**
 * Weekly opening hours, local to the destination. Several rows per weekday
 * allow split hours (10:00–14:00, 16:00–20:00). Hours past midnight are two
 * rows: 22:00–24:00 on the first day and 00:00–02:00 on the next. No rows =
 * hours unknown.
 */
export const activityOpeningHours = pgTable(
  "activity_opening_hours",
  {
    id: id(),
    activityId: uuid()
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    /** ISO weekday, 1 = Monday … 7 = Sunday. */
    weekday: smallint().notNull(),
    opensAt: time().notNull(),
    closesAt: time().notNull(),
  },
  (t) => [
    index("activity_opening_hours_activity_id_idx").on(t.activityId),
    check("activity_opening_hours_weekday_range", sql`${t.weekday} BETWEEN 1 AND 7`),
    check("activity_opening_hours_order", sql`${t.closesAt} > ${t.opensAt}`),
  ],
);

function coordinateChecks(table: string, t: { latitude: AnyPgColumn; longitude: AnyPgColumn }) {
  return [
    check(`${table}_latitude_range`, sql`${t.latitude} BETWEEN -90 AND 90`),
    check(`${table}_longitude_range`, sql`${t.longitude} BETWEEN -180 AND 180`),
  ];
}
