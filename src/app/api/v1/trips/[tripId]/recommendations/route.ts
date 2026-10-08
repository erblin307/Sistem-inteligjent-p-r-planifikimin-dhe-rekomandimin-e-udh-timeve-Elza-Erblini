import { getDb } from "@/server/db/client";
import { recommendForTrip } from "@/server/modules/recommendations";
import { getTrip } from "@/server/modules/trips";
import { requireUser } from "@/server/platform/auth";
import { json, route } from "@/server/platform/http";

type Ctx = RouteContext<"/api/v1/trips/[tripId]/recommendations">;

/** GET /api/v1/trips/:tripId/recommendations — ranked hotels and activities for the trip. */
export const GET = route<Ctx>(async (request, { params }) => {
  const db = getDb();
  const user = await requireUser(db, request);
  const { tripId } = await params;
  const trip = await getTrip({ db, user }, tripId);
  return json(await recommendForTrip({ db }, trip));
});
