import { createTripInput } from "@/contracts/trip";
import { getDb } from "@/server/db/client";
import { listTrips, planTrip } from "@/server/modules/trips";
import { requireUser } from "@/server/platform/auth";
import { json, parseJsonBody, route } from "@/server/platform/http";

/** GET /api/v1/trips — the signed-in user's trips, newest start date first. */
export const GET = route(async (request) => {
  const db = getDb();
  const user = await requireUser(db, request);
  return json({ items: await listTrips({ db, user }) });
});

/**
 * POST /api/v1/trips — submit a trip brief (destination, dates or number of
 * days, travelers, budget, preferences, interests). Creates a draft trip.
 */
export const POST = route(async (request) => {
  const db = getDb();
  const user = await requireUser(db, request);
  const input = await parseJsonBody(request, createTripInput);
  const trip = await planTrip({ db, user }, input);
  return json(trip, { status: 201, headers: { location: `/api/v1/trips/${trip.id}` } });
});
