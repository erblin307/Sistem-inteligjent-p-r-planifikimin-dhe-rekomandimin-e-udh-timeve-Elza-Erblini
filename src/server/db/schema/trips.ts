import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  doublePrecision,
  index,
  pgTable,
  primaryKey,
  smallint,
  text,
  uuid,
} from "drizzle-orm/pg-core";

import { activityCategories, destinations } from "./catalog";
import { currencyCode, id, minorUnits, timestamps } from "./columns";
import {
  accommodationType,
  dietaryRequirement,
  inboundTransportMode,
  localTransportMode,
  travelPace,
  travelStyle,
  tripStatus,
} from "./enums";
import { users } from "./identity";

/**
 * A trip is the user's brief. Generated output (itineraries, budget lines,
 * recommendations) lives in itineraries.ts and points back here.
 *
 * Derived values are not stored: number of days and nights come from the
 * dates, the child count from childAges, total travelers from both.
 */
export const trips = pgTable(
  "trips",
  {
    id: id(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    destinationId: uuid()
      .notNull()
      .references(() => destinations.id, { onDelete: "restrict" }),
    title: text(),
    status: tripStatus().notNull().default("draft"),

    /** Calendar dates in the destination's time zone (no time component). */
    startDate: date({ mode: "string" }).notNull(),
    endDate: date({ mode: "string" }).notNull(),

    departureCity: text(),
    departureLatitude: doublePrecision(),
    departureLongitude: doublePrecision(),

    adults: smallint().notNull(),
    /** One entry per child, age in years at travel time. */
    childAges: smallint().array().notNull().default(sql`'{}'`),

    budgetMinor: minorUnits().notNull(),
    currency: currencyCode().notNull(),
    /** Whether flights/trains to the destination come out of the budget. */
    budgetIncludesTransport: boolean().notNull().default(true),

    travelStyle: travelStyle().notNull(),
    pace: travelPace().notNull().default("moderate"),
    /** Null = any type. */
    accommodationType: accommodationType(),
    /** Null = any category. */
    minHotelStars: smallint(),
    localTransportModes: localTransportMode().array().notNull(),
    /** Null = no preference. */
    inboundTransportMode: inboundTransportMode(),
    dietaryRequirements: dietaryRequirement().array().notNull().default(sql`'{}'`),

    ...timestamps,
  },
  (t) => [
    // "My trips": a user's trips ordered by date.
    index("trips_user_id_start_date_idx").on(t.userId, t.startDate),
    check("trips_dates_order", sql`${t.endDate} >= ${t.startDate}`),
    check("trips_adults_min", sql`${t.adults} >= 1`),
    check(
      "trips_child_ages_range",
      sql`array_position(${t.childAges}, NULL) IS NULL
        AND 0 <= ALL(${t.childAges}) AND 17 >= ALL(${t.childAges})`,
    ),
    check("trips_party_size_max", sql`${t.adults} + cardinality(${t.childAges}) <= 10`),
    check("trips_budget_nonnegative", sql`${t.budgetMinor} >= 0`),
    check("trips_currency_format", sql`${t.currency} ~ '^[A-Z]{3}$'`),
    check("trips_min_hotel_stars_range", sql`${t.minHotelStars} BETWEEN 1 AND 5`),
    check(
      "trips_local_transport_not_empty",
      sql`cardinality(${t.localTransportModes}) >= 1
        AND array_position(${t.localTransportModes}, NULL) IS NULL`,
    ),
    check(
      "trips_departure_coordinates_pair",
      sql`(${t.departureLatitude} IS NULL) = (${t.departureLongitude} IS NULL)`,
    ),
  ],
);

/** Interests selected in the brief. Uses the shared activity categories. */
export const tripInterests = pgTable(
  "trip_interests",
  {
    tripId: uuid()
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    categoryId: uuid()
      .notNull()
      .references(() => activityCategories.id, { onDelete: "restrict" }),
  },
  (t) => [primaryKey({ columns: [t.tripId, t.categoryId] })],
);
