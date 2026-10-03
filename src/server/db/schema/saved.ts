import { sql } from "drizzle-orm";
import { check, index, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { activities, destinations, hotels } from "./catalog";
import { id } from "./columns";
import { users } from "./identity";

/**
 * A saved hotel, activity or destination. Explicit foreign keys (not a
 * polymorphic type/id pair) so each reference is enforced by the database;
 * a CHECK guarantees exactly one is set.
 */
export const savedPlaces = pgTable(
  "saved_places",
  {
    id: id(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    destinationId: uuid().references(() => destinations.id, { onDelete: "cascade" }),
    hotelId: uuid().references(() => hotels.id, { onDelete: "cascade" }),
    activityId: uuid().references(() => activities.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      "saved_places_exactly_one_target",
      sql`num_nonnulls(${t.destinationId}, ${t.hotelId}, ${t.activityId}) = 1`,
    ),
    // Saving the same place twice is a no-op, enforced per target type.
    uniqueIndex("saved_places_user_destination_key")
      .on(t.userId, t.destinationId)
      .where(sql`${t.destinationId} IS NOT NULL`),
    uniqueIndex("saved_places_user_hotel_key")
      .on(t.userId, t.hotelId)
      .where(sql`${t.hotelId} IS NOT NULL`),
    uniqueIndex("saved_places_user_activity_key")
      .on(t.userId, t.activityId)
      .where(sql`${t.activityId} IS NOT NULL`),
    // The Saved page lists everything for a user, newest first.
    index("saved_places_user_id_created_at_idx").on(t.userId, t.createdAt.desc()),
  ],
);
