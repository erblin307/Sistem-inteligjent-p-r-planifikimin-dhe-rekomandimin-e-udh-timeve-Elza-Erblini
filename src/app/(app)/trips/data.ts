import "server-only";

import { connection } from "next/server";
import { cache } from "react";

import type { TripResponse, TripSummaryResponse } from "@/contracts/trip";
import { getDb } from "@/server/db/client";
import { recommendForTrip } from "@/server/modules/recommendations";
import { getTrip, listTrips } from "@/server/modules/trips";
import { currentUser } from "@/server/platform/auth";
import { NotFoundError } from "@/server/platform/errors";
import type { TripSummary } from "@/lib/fixtures/barcelona";

/**
 * Data for the trip pages. A workspace is either a saved trip (loaded from
 * the trips module, owner-scoped) or the Barcelona sample, which stays
 * available as a labelled example. `cache` lets the layout and the page share
 * one load per request.
 */

export const SAMPLE_TRIP_ID = "barcelona";

export type Workspace =
  | { kind: "sample" }
  | { kind: "trip"; trip: TripResponse }
  | { kind: "signed-out" }
  | { kind: "not-found" };

export const loadWorkspace = cache(async (tripId: string): Promise<Workspace> => {
  if (tripId === SAMPLE_TRIP_ID) return { kind: "sample" };
  const db = getDb();
  const user = await currentUser(db);
  if (!user) return { kind: "signed-out" };
  try {
    return { kind: "trip", trip: await getTrip({ db, user }, tripId) };
  } catch (error) {
    if (error instanceof NotFoundError) return { kind: "not-found" };
    throw error;
  }
});

export const loadRecommendations = cache(async (trip: TripResponse) =>
  recommendForTrip({ db: getDb() }, trip),
);

/** The viewer's saved trips, or null when there is no user or no database. */
export async function loadMyTrips(): Promise<TripSummaryResponse[] | null> {
  // Per-user data: never prerender it at build time.
  await connection();
  try {
    const db = getDb();
    const user = await currentUser(db);
    return user ? await listTrips({ db, user }) : null;
  } catch (error) {
    console.error("Could not load trips", error);
    return null;
  }
}

/** Shape the shared trip header expects. */
export function toTripSummary(trip: TripResponse): TripSummary {
  return {
    destination: trip.destination.name,
    country: "",
    startDate: new Date(`${trip.startDate}T00:00:00Z`),
    endDate: new Date(`${trip.endDate}T00:00:00Z`),
    adults: trip.travelers.adults,
    children: trip.travelers.childAges.length,
    budget: { amountMinor: trip.budget.amountMinor, currency: trip.budget.currency },
    status: trip.status,
  };
}
