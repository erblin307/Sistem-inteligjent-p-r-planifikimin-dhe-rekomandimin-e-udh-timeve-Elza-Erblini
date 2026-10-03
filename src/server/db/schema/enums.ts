import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Closed vocabularies used by the brief, the engines and the UI.
 * Open-ended taxonomies (activity categories, amenities) are tables instead,
 * so they can grow without a migration.
 */

export const tripStatus = pgEnum("trip_status", ["draft", "planned", "archived"]);

/** How much the party wants to spend. Drives budget shares and style fit. */
export const travelStyle = pgEnum("travel_style", ["budget", "balanced", "comfort", "premium"]);

/** How full each day should be. Drives itinerary day capacity. */
export const travelPace = pgEnum("travel_pace", ["relaxed", "moderate", "packed"]);

export const accommodationType = pgEnum("accommodation_type", [
  "hotel",
  "apartment",
  "hostel",
  "guesthouse",
]);

/** Getting around inside the destination. */
export const localTransportMode = pgEnum("local_transport_mode", [
  "walk",
  "public_transport",
  "taxi",
  "car",
  "bike",
]);

/** Getting to the destination. */
export const inboundTransportMode = pgEnum("inbound_transport_mode", [
  "flight",
  "train",
  "bus",
  "car",
]);

/** Hard dietary constraints (soft cuisine tastes are not stored yet). */
export const dietaryRequirement = pgEnum("dietary_requirement", [
  "vegetarian",
  "vegan",
  "halal",
  "kosher",
  "gluten_free",
]);

export const itineraryStatus = pgEnum("itinerary_status", ["active", "superseded"]);

export const itineraryDayKind = pgEnum("itinerary_day_kind", ["arrival", "full", "departure"]);

export const itineraryItemType = pgEnum("itinerary_item_type", [
  "activity",
  "meal",
  "hotel",
  "free",
]);

export const budgetCategory = pgEnum("budget_category", [
  "accommodation",
  "transport",
  "food",
  "activities",
  "local_transport",
  "reserve",
]);

export const recommendationKind = pgEnum("recommendation_kind", ["hotel", "activity"]);
