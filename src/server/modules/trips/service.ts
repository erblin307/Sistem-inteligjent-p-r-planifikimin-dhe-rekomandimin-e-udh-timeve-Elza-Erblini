import { and, eq } from "drizzle-orm";

import {
  dayCount,
  type ParsedCreateTripInput,
  type TripResponse,
  type TripSummaryResponse,
} from "@/contracts/trip";
import type { Database } from "@/server/db/client";
import { destinations } from "@/server/db/schema";
import type { RequestUser } from "@/server/platform/auth";
import { NotFoundError, ValidationError } from "@/server/platform/errors";
import {
  UnknownInterestError,
  createTrip,
  deleteTripForOwner,
  getTripForOwner,
  listTripsForOwner,
  type TripWithDetails,
} from "./repo";

/**
 * Trip use cases. Validation of the brief's shape happens in the contract;
 * rules that need data (destination exists, start date is not in the past
 * at the destination) happen here.
 */

type Ctx = { db: Database; user: RequestUser; now?: Date };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function planTrip(ctx: Ctx, input: ParsedCreateTripInput): Promise<TripResponse> {
  const destination = await ctx.db.query.destinations.findFirst({
    where: and(eq(destinations.id, input.destinationId), eq(destinations.isActive, true)),
    columns: { id: true, timezone: true },
  });
  if (!destination) {
    throw new ValidationError([
      { path: "destinationId", message: "Choose a destination from the list." },
    ]);
  }

  const today = localDate(ctx.now ?? new Date(), destination.timezone);
  if (input.startDate < today) {
    throw new ValidationError([
      { path: "startDate", message: `Check-in can't be in the past. It is ${today} at the destination.` },
    ]);
  }

  let tripId: string;
  try {
    tripId = (await createTrip(ctx.db, ctx.user.id, input)).id;
  } catch (error) {
    if (error instanceof UnknownInterestError) {
      throw new ValidationError([
        { path: "interests", message: `Unknown interests: ${error.slugs.join(", ")}.` },
      ]);
    }
    throw error;
  }

  const trip = await getTripForOwner(ctx.db, ctx.user.id, tripId);
  if (!trip) throw new Error(`Trip ${tripId} was created but could not be read back`);
  return toTripResponse(trip);
}

export async function getTrip(ctx: Ctx, tripId: string): Promise<TripResponse> {
  const trip = UUID.test(tripId) ? await getTripForOwner(ctx.db, ctx.user.id, tripId) : null;
  if (!trip) throw new NotFoundError("Trip");
  return toTripResponse(trip);
}

export async function listTrips(ctx: Ctx): Promise<TripSummaryResponse[]> {
  const rows = await listTripsForOwner(ctx.db, ctx.user.id);
  return rows.map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    destination: t.destination,
    startDate: t.startDate,
    endDate: t.endDate,
    days: dayCount(t.startDate, t.endDate),
    travelers: { total: t.adults + t.childAges.length },
    budget: { amountMinor: t.budgetMinor, currency: t.currency, includesTransport: t.budgetIncludesTransport },
  }));
}

export async function deleteTrip(ctx: Ctx, tripId: string): Promise<void> {
  const deleted = UUID.test(tripId) && (await deleteTripForOwner(ctx.db, ctx.user.id, tripId));
  if (!deleted) throw new NotFoundError("Trip");
}

export function toTripResponse(t: TripWithDetails): TripResponse {
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    destination: t.destination,
    startDate: t.startDate,
    endDate: t.endDate,
    days: t.days,
    nights: t.nights,
    travelers: { adults: t.adults, childAges: t.childAges, total: t.travelers },
    departure: t.departureCity
      ? { city: t.departureCity, latitude: t.departureLatitude, longitude: t.departureLongitude }
      : null,
    budget: { amountMinor: t.budgetMinor, currency: t.currency, includesTransport: t.budgetIncludesTransport },
    preferences: {
      travelStyle: t.travelStyle,
      pace: t.pace,
      accommodationType: t.accommodationType,
      minHotelStars: t.minHotelStars,
      localTransportModes: t.localTransportModes,
      inboundTransportMode: t.inboundTransportMode,
      dietaryRequirements: t.dietaryRequirements,
      interests: t.interests,
    },
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

/** Calendar date ("YYYY-MM-DD") at an instant in an IANA time zone. */
export function localDate(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}
