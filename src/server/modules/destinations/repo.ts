import { and, asc, count, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";

import type { Database } from "@/server/db/client";
import { activities, activityCategories, amenities, destinations } from "@/server/db/schema";

/**
 * Destination reads. Hotel and activity statistics and the "has a hotel /
 * activity that…" filters are correlated subqueries written as SQL
 * fragments: Drizzle has no builder for percentile_cont or scalar subqueries
 * in a select list, and its single-table selects leave columns unqualified
 * (see below). Values are always bound as parameters. The catalog is small per destination, so this stays cheap;
 * a materialised summary can replace it if that changes.
 */

export type DestinationFilters = {
  q?: string | undefined;
  country?: string | undefined;
  city?: string | undefined;
  interestSlugs?: string[] | undefined;
  minStars?: number | undefined;
  amenitySlugs?: string[] | undefined;
  maxNightlyPriceMinor?: number | undefined;
  currency?: string | undefined;
};

export type DestinationCursor = { name: string; id: string };

/*
 * Correlated subqueries are written with explicit aliases. Drizzle renders
 * unqualified column names in single-table selects, so "destination_id" =
 * "id" would silently compare a hotel's destination with the hotel's own id.
 */
const D = sql.raw(`"destinations"`);

const stats = {
  hotelCount: sql<number>`(
    SELECT count(*)::int FROM hotels h WHERE h.destination_id = ${D}.id
  )`,
  nightlyFrom: sql<number | null>`(
    SELECT min(h.nightly_price_minor) FROM hotels h
    WHERE h.destination_id = ${D}.id AND h.currency = ${D}.currency
  )`,
  nightlyMedian: sql<number | null>`(
    SELECT round(percentile_cont(0.5) WITHIN GROUP (ORDER BY h.nightly_price_minor))::int
    FROM hotels h
    WHERE h.destination_id = ${D}.id AND h.currency = ${D}.currency
      AND h.nightly_price_minor IS NOT NULL
  )`,
  activityCount: sql<number>`(
    SELECT count(*)::int FROM activities a WHERE a.destination_id = ${D}.id
  )`,
  categorySlugs: sql<string[]>`(
    SELECT coalesce(array_agg(DISTINCT c.slug ORDER BY c.slug), '{}')
    FROM activities a JOIN activity_categories c ON c.id = a.category_id
    WHERE a.destination_id = ${D}.id
  )`,
};

const columns = {
  id: destinations.id,
  slug: destinations.slug,
  name: destinations.name,
  countryCode: destinations.countryCode,
  region: destinations.region,
  latitude: destinations.latitude,
  longitude: destinations.longitude,
  timezone: destinations.timezone,
  currency: destinations.currency,
  imageUrl: destinations.imageUrl,
  ...stats,
};

export type DestinationRow = Awaited<ReturnType<typeof listDestinations>>[number];

export async function listDestinations(
  db: Database,
  filters: DestinationFilters,
  page: { limit: number; after?: DestinationCursor | undefined },
) {
  const conditions: (SQL | undefined)[] = [eq(destinations.isActive, true)];

  if (filters.q) {
    const pattern = `%${escapeLike(filters.q)}%`;
    conditions.push(
      or(
        ilike(destinations.name, pattern),
        ilike(destinations.region, pattern),
        eq(destinations.countryCode, filters.q.toUpperCase()),
      ),
    );
  }
  if (filters.country) conditions.push(eq(destinations.countryCode, filters.country));
  if (filters.city) conditions.push(ilike(destinations.name, escapeLike(filters.city)));

  for (const slug of filters.interestSlugs ?? []) {
    conditions.push(sql`EXISTS (
      SELECT 1 FROM activities a JOIN activity_categories c ON c.id = a.category_id
      WHERE a.destination_id = ${D}.id AND c.slug = ${slug}
    )`);
  }

  const hotelConditions = hotelFilter(filters);
  if (hotelConditions) {
    conditions.push(sql`EXISTS (
      SELECT 1 FROM hotels h WHERE h.destination_id = ${D}.id AND ${hotelConditions}
    )`);
  }

  if (page.after) {
    conditions.push(
      sql`(${destinations.name}, ${destinations.id}) > (${page.after.name}, ${page.after.id}::uuid)`,
    );
  }

  return db
    .select(columns)
    .from(destinations)
    .where(and(...conditions))
    .orderBy(asc(destinations.name), asc(destinations.id))
    .limit(page.limit);
}

export async function findDestination(db: Database, idOrSlug: string, isId: boolean) {
  const [row] = await db
    .select(columns)
    .from(destinations)
    .where(
      and(
        eq(destinations.isActive, true),
        isId ? eq(destinations.id, idOrSlug) : eq(destinations.slug, idOrSlug.toLowerCase()),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function categoryCounts(db: Database, destinationId: string) {
  return db
    .select({ slug: activityCategories.slug, name: activityCategories.name, count: count() })
    .from(activities)
    .innerJoin(activityCategories, eq(activityCategories.id, activities.categoryId))
    .where(eq(activities.destinationId, destinationId))
    .groupBy(activityCategories.slug, activityCategories.name)
    .orderBy(asc(activityCategories.slug));
}

/** Slugs from `wanted` that do not exist in the vocabulary. */
export async function unknownSlugs(
  db: Database,
  kind: "interest" | "amenity",
  wanted: string[],
): Promise<string[]> {
  if (wanted.length === 0) return [];
  const table = kind === "interest" ? activityCategories : amenities;
  const found = await db.select({ slug: table.slug }).from(table).where(inArray(table.slug, wanted));
  const known = new Set(found.map((r) => r.slug));
  return wanted.filter((s) => !known.has(s));
}

/** Conditions on one hotel row aliased `h`; all must hold for the same hotel. */
function hotelFilter(f: DestinationFilters): SQL | undefined {
  const parts: SQL[] = [];
  if (f.minStars !== undefined) parts.push(sql`h.stars >= ${f.minStars}`);
  if (f.maxNightlyPriceMinor !== undefined && f.currency) {
    parts.push(sql`h.currency = ${f.currency} AND h.nightly_price_minor <= ${f.maxNightlyPriceMinor}`);
  }
  const slugs = f.amenitySlugs ?? [];
  if (slugs.length > 0) {
    parts.push(sql`(
      SELECT count(*) FROM hotel_amenities ha JOIN amenities am ON am.id = ha.amenity_id
      WHERE ha.hotel_id = h.id AND am.slug IN (${sql.join(
        slugs.map((slug) => sql`${slug}`),
        sql`, `,
      )})
    ) = ${slugs.length}`);
  }
  return parts.length ? sql.join(parts, sql` AND `) : undefined;
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}
