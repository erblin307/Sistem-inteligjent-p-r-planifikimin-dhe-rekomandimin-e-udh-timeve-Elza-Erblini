import type {
  DestinationResponse,
  DestinationSummaryResponse,
  ListDestinationsQuery,
  ListDestinationsResponse,
} from "@/contracts/destination";
import type { Database } from "@/server/db/client";
import { NotFoundError, ValidationError, type FieldIssue } from "@/server/platform/errors";
import {
  categoryCounts,
  findDestination,
  listDestinations,
  unknownSlugs,
  type DestinationCursor,
  type DestinationRow,
} from "./repo";

type Ctx = { db: Database };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function searchDestinations(
  ctx: Ctx,
  query: ListDestinationsQuery,
): Promise<ListDestinationsResponse> {
  const issues: FieldIssue[] = [];
  const badInterests = await unknownSlugs(ctx.db, "interest", query.interest ?? []);
  if (badInterests.length) issues.push({ path: "interest", message: `Unknown interests: ${badInterests.join(", ")}.` });
  const badAmenities = await unknownSlugs(ctx.db, "amenity", query.amenity ?? []);
  if (badAmenities.length) issues.push({ path: "amenity", message: `Unknown amenities: ${badAmenities.join(", ")}.` });
  const after = query.cursor ? decodeCursor(query.cursor) : undefined;
  if (query.cursor && !after) issues.push({ path: "cursor", message: "This page link has expired. Start from the first page." });
  if (issues.length) throw new ValidationError(issues);

  const rows = await listDestinations(
    ctx.db,
    {
      q: query.q,
      country: query.country,
      city: query.city,
      interestSlugs: query.interest,
      minStars: query.minStars,
      amenitySlugs: query.amenity,
      maxNightlyPriceMinor: query.maxNightlyPriceMinor,
      currency: query.currency,
    },
    { limit: query.limit + 1, after },
  );

  const page = rows.slice(0, query.limit);
  const last = page.at(-1);
  return {
    items: page.map(toSummary),
    nextCursor: rows.length > query.limit && last ? encodeCursor({ name: last.name, id: last.id }) : null,
  };
}

export async function getDestination(ctx: Ctx, idOrSlug: string): Promise<DestinationResponse> {
  const isId = UUID.test(idOrSlug);
  if (!isId && !/^[a-z0-9-]{1,80}$/i.test(idOrSlug)) throw new NotFoundError("Destination");
  const row = await findDestination(ctx.db, idOrSlug, isId);
  if (!row) throw new NotFoundError("Destination");
  const categories = await categoryCounts(ctx.db, row.id);
  return { ...toSummary(row), activities: { count: row.activityCount, categories } };
}

function toSummary(r: DestinationRow): DestinationSummaryResponse {
  const money = (amountMinor: number | null) =>
    amountMinor === null ? null : { amountMinor, currency: r.currency };
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    countryCode: r.countryCode,
    region: r.region,
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone,
    currency: r.currency,
    imageUrl: r.imageUrl,
    hotels: {
      count: r.hotelCount,
      nightlyFrom: money(r.nightlyFrom),
      nightlyMedian: money(r.nightlyMedian),
    },
    activities: { count: r.activityCount, categories: r.categorySlugs },
  };
}

function encodeCursor(c: DestinationCursor) {
  return Buffer.from(JSON.stringify([c.name, c.id])).toString("base64url");
}

function decodeCursor(raw: string): DestinationCursor | undefined {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (
      Array.isArray(parsed) &&
      typeof parsed[0] === "string" &&
      typeof parsed[1] === "string" &&
      UUID.test(parsed[1])
    ) {
      return { name: parsed[0], id: parsed[1] };
    }
  } catch {
    // fall through
  }
  return undefined;
}
