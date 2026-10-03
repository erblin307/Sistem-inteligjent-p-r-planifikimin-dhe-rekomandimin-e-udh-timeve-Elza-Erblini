import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  time,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { activities, hotels } from "./catalog";
import { currencyCode, id, minorUnits, timestamps } from "./columns";
import {
  budgetCategory,
  itineraryDayKind,
  itineraryItemType,
  itineraryStatus,
  localTransportMode,
  recommendationKind,
} from "./enums";
import { trips } from "./trips";

/*
 * Generated plans. An itinerary is one version of the plan for a trip. It
 * snapshots what can change after generation (prices, scores, the chosen
 * hotel), so a saved plan reads the same next month. Catalog rows are
 * referenced, never copied.
 *
 * All amounts in an itinerary are in `itineraries.currency`, converted at
 * generation time.
 */

export const itineraries = pgTable(
  "itineraries",
  {
    id: id(),
    tripId: uuid()
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    version: integer().notNull(),
    status: itineraryStatus().notNull().default("active"),
    hotelId: uuid().references(() => hotels.id, { onDelete: "restrict" }),
    /** Accommodation total for the stay at generation time. */
    hotelTotalMinor: minorUnits(),
    currency: currencyCode().notNull(),
    /** Engine and scoring-weights versions that produced this plan. */
    engineVersion: text().notNull(),
    scoringVersion: text().notNull(),
    generatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    ...timestamps,
  },
  (t) => [
    unique("itineraries_trip_id_version_key").on(t.tripId, t.version),
    // At most one current plan per trip; regenerating supersedes the old one.
    uniqueIndex("itineraries_one_active_per_trip")
      .on(t.tripId)
      .where(sql`${t.status} = 'active'`),
    check("itineraries_version_positive", sql`${t.version} >= 1`),
    check("itineraries_hotel_total_nonnegative", sql`${t.hotelTotalMinor} >= 0`),
    check("itineraries_currency_format", sql`${t.currency} ~ '^[A-Z]{3}$'`),
    check(
      "itineraries_hotel_total_requires_hotel",
      sql`${t.hotelTotalMinor} IS NULL OR ${t.hotelId} IS NOT NULL`,
    ),
  ],
);

export const itineraryDays = pgTable(
  "itinerary_days",
  {
    id: id(),
    itineraryId: uuid()
      .notNull()
      .references(() => itineraries.id, { onDelete: "cascade" }),
    dayNumber: smallint().notNull(),
    date: date({ mode: "string" }).notNull(),
    kind: itineraryDayKind().notNull().default("full"),
    notes: text(),
  },
  (t) => [
    unique("itinerary_days_itinerary_id_day_number_key").on(t.itineraryId, t.dayNumber),
    unique("itinerary_days_itinerary_id_date_key").on(t.itineraryId, t.date),
    check("itinerary_days_day_number_positive", sql`${t.dayNumber} >= 1`),
  ],
);

/**
 * One stop in a day. Activity and hotel stops reference the catalog; meals
 * and free time carry their own title and optional position. The cost is a
 * snapshot because catalog prices change.
 */
export const itineraryItems = pgTable(
  "itinerary_items",
  {
    id: id(),
    dayId: uuid()
      .notNull()
      .references(() => itineraryDays.id, { onDelete: "cascade" }),
    position: smallint().notNull(),
    type: itineraryItemType().notNull(),
    activityId: uuid().references(() => activities.id, { onDelete: "restrict" }),
    hotelId: uuid().references(() => hotels.id, { onDelete: "restrict" }),
    /** Required for meals and free time; overrides the catalog name otherwise. */
    title: text(),
    latitude: doublePrecision(),
    longitude: doublePrecision(),
    /** Local time at the destination. End = start + duration. */
    startTime: time().notNull(),
    durationMinutes: smallint().notNull(),
    estimatedCostMinor: minorUnits().notNull().default(0),
    locked: boolean().notNull().default(false),
    notes: text(),
    /** Travel from the previous item. Null for the first item of the day. */
    travelMode: localTransportMode(),
    travelMinutes: smallint(),
    travelMeters: integer(),
  },
  (t) => [
    unique("itinerary_items_day_id_position_key").on(t.dayId, t.position),
    check("itinerary_items_position_nonnegative", sql`${t.position} >= 0`),
    check("itinerary_items_duration_positive", sql`${t.durationMinutes} > 0`),
    check("itinerary_items_cost_nonnegative", sql`${t.estimatedCostMinor} >= 0`),
    check(
      "itinerary_items_reference_matches_type",
      sql`CASE ${t.type}
        WHEN 'activity' THEN ${t.activityId} IS NOT NULL AND ${t.hotelId} IS NULL
        WHEN 'hotel' THEN ${t.hotelId} IS NOT NULL AND ${t.activityId} IS NULL
        ELSE ${t.activityId} IS NULL AND ${t.hotelId} IS NULL AND ${t.title} IS NOT NULL
      END`,
    ),
    check(
      "itinerary_items_coordinates_pair",
      sql`(${t.latitude} IS NULL) = (${t.longitude} IS NULL)`,
    ),
    check(
      "itinerary_items_travel_complete",
      sql`(${t.travelMode} IS NULL) = (${t.travelMinutes} IS NULL)
        AND (${t.travelMinutes} IS NULL OR ${t.travelMinutes} >= 0)
        AND (${t.travelMeters} IS NULL OR ${t.travelMeters} >= 0)`,
    ),
  ],
);

/** Budget allocation for one plan: one row per category. */
export const budgetLines = pgTable(
  "budget_lines",
  {
    id: id(),
    itineraryId: uuid()
      .notNull()
      .references(() => itineraries.id, { onDelete: "cascade" }),
    category: budgetCategory().notNull(),
    plannedMinor: minorUnits().notNull(),
    lowMinor: minorUnits().notNull(),
    highMinor: minorUnits().notNull(),
    /** Plain-language basis, e.g. "5 nights × €142, 1 room". */
    basis: text(),
  },
  (t) => [
    unique("budget_lines_itinerary_id_category_key").on(t.itineraryId, t.category),
    check(
      "budget_lines_range_order",
      sql`0 <= ${t.lowMinor} AND ${t.lowMinor} <= ${t.plannedMinor} AND ${t.plannedMinor} <= ${t.highMinor}`,
    ),
  ],
);

/**
 * Ranked results behind a plan, kept for explanation and audit ("why was
 * this hotel picked?"). Scores depend on prices and ratings that change, so
 * they cannot be recomputed later. Live browsing re-ranks on request and
 * does not write here.
 */
export const recommendations = pgTable(
  "recommendations",
  {
    id: id(),
    itineraryId: uuid()
      .notNull()
      .references(() => itineraries.id, { onDelete: "cascade" }),
    kind: recommendationKind().notNull(),
    hotelId: uuid().references(() => hotels.id, { onDelete: "restrict" }),
    activityId: uuid().references(() => activities.id, { onDelete: "restrict" }),
    rank: smallint().notNull(),
    /** 0–100. */
    score: smallint().notNull(),
    /** Component scores (0–1) keyed by component name. */
    breakdown: jsonb().$type<Record<string, number>>().notNull(),
    /** Stable reason codes such as "INTEREST_MATCH:architecture". */
    reasons: text().array().notNull().default(sql`'{}'`),
    /** Price the score was computed with (per night or per person). */
    priceMinor: minorUnits(),
  },
  (t) => [
    unique("recommendations_itinerary_id_kind_rank_key").on(t.itineraryId, t.kind, t.rank),
    check("recommendations_score_range", sql`${t.score} BETWEEN 0 AND 100`),
    check("recommendations_rank_positive", sql`${t.rank} >= 1`),
    check("recommendations_price_nonnegative", sql`${t.priceMinor} >= 0`),
    check(
      "recommendations_reference_matches_kind",
      sql`CASE ${t.kind}
        WHEN 'hotel' THEN ${t.hotelId} IS NOT NULL AND ${t.activityId} IS NULL
        WHEN 'activity' THEN ${t.activityId} IS NOT NULL AND ${t.hotelId} IS NULL
      END`,
    ),
  ],
);
