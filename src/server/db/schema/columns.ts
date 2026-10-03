import { sql } from "drizzle-orm";
import { char, doublePrecision, integer, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Shared column helpers. Column names are camelCase in TypeScript and
 * snake_case in Postgres (the `casing` option on the client and drizzle-kit).
 */

export const id = () => uuid().primaryKey().default(sql`gen_random_uuid()`);

export const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** Money is integer minor units (€15.99 → 1599). See docs/ARCHITECTURE.md §6.1. */
export const minorUnits = () => integer();

/** ISO 4217 code, e.g. "EUR". */
export const currencyCode = () => char({ length: 3 });

export const coordinates = {
  latitude: doublePrecision().notNull(),
  longitude: doublePrecision().notNull(),
};

/**
 * Provenance for catalog records. `source` is a provider key ("curated",
 * "fixture", "google_places", …); `externalId` is that provider's id.
 * Generic on purpose: no provider-specific columns.
 */
export const provenance = {
  source: text().notNull(),
  externalId: text(),
  lastSyncedAt: timestamp({ withTimezone: true }),
};
