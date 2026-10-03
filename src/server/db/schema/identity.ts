import { sql } from "drizzle-orm";
import { check, pgTable, smallint, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { currencyCode, id, timestamps } from "./columns";
import {
  accommodationType,
  dietaryRequirement,
  localTransportMode,
  travelPace,
  travelStyle,
} from "./enums";

/**
 * Columns follow the Auth.js Drizzle adapter's user shape (id, name, email,
 * emailVerified, image) so sign-in can be added without a second user table.
 * Accounts, sessions and verification tokens belong to the auth library and
 * are added together with it.
 */
export const users = pgTable("users", {
  id: id(),
  email: text().notNull().unique(),
  name: text(),
  emailVerified: timestamp({ withTimezone: true }),
  image: text(),
  ...timestamps,
});

/**
 * Defaults that pre-fill a new trip brief. A trip copies what it needs at
 * creation; editing these later never changes existing trips.
 */
export const userPreferences = pgTable(
  "user_preferences",
  {
    userId: uuid()
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    currency: currencyCode().notNull().default("EUR"),
    travelStyle: travelStyle(),
    pace: travelPace(),
    accommodationType: accommodationType(),
    minHotelStars: smallint(),
    localTransportModes: localTransportMode().array().notNull().default(sql`'{}'`),
    dietaryRequirements: dietaryRequirement().array().notNull().default(sql`'{}'`),
    homeCity: text(),
    ...timestamps,
  },
  (t) => [
    check("user_preferences_min_hotel_stars_range", sql`${t.minHotelStars} BETWEEN 1 AND 5`),
    check("user_preferences_currency_format", sql`${t.currency} ~ '^[A-Z]{3}$'`),
  ],
);
