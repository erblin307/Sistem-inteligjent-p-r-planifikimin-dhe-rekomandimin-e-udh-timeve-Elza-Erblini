import { sql } from "drizzle-orm";

import type { Database } from "@/server/db/client";
import { activityCategories, amenities } from "@/server/db/schema";

/**
 * Reference vocabularies the product depends on in every environment.
 * Idempotent: re-running updates names and never removes rows in use.
 */

export const ACTIVITY_CATEGORIES = [
  { slug: "architecture", name: "Architecture" },
  { slug: "museums", name: "Museums" },
  { slug: "history", name: "History" },
  { slug: "food", name: "Food & markets" },
  { slug: "nature", name: "Parks & nature" },
  { slug: "beaches", name: "Beaches" },
  { slug: "hiking", name: "Hiking" },
  { slug: "adventure", name: "Adventure" },
  { slug: "viewpoints", name: "Viewpoints" },
  { slug: "shopping", name: "Shopping" },
  { slug: "nightlife", name: "Nightlife" },
  { slug: "relaxation", name: "Relaxation" },
  { slug: "family", name: "Family" },
  { slug: "photography", name: "Photography" },
] as const;

export const AMENITIES = [
  { slug: "breakfast-included", name: "Breakfast included" },
  { slug: "free-wifi", name: "Free Wi-Fi" },
  { slug: "air-conditioning", name: "Air conditioning" },
  { slug: "rooftop-terrace", name: "Rooftop terrace" },
  { slug: "24-hour-reception", name: "24-hour reception" },
  { slug: "pool", name: "Pool" },
  { slug: "parking", name: "Parking" },
  { slug: "family-rooms", name: "Family rooms" },
  { slug: "kitchen", name: "Kitchen" },
  { slug: "accessible", name: "Step-free access" },
] as const;

export async function seedReferenceData(db: Database) {
  await db
    .insert(activityCategories)
    .values([...ACTIVITY_CATEGORIES])
    .onConflictDoUpdate({ target: activityCategories.slug, set: { name: sql`excluded.name` } });
  await db
    .insert(amenities)
    .values([...AMENITIES])
    .onConflictDoUpdate({ target: amenities.slug, set: { name: sql`excluded.name` } });
}
