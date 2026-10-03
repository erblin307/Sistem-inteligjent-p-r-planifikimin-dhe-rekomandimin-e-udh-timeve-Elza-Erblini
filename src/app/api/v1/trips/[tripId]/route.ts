import { getDb } from "@/server/db/client";
import { deleteTrip, getTrip } from "@/server/modules/trips";
import { requireUser } from "@/server/platform/auth";
import { json, route } from "@/server/platform/http";

type Ctx = RouteContext<"/api/v1/trips/[tripId]">;

/** GET /api/v1/trips/:tripId */
export const GET = route<Ctx>(async (request, { params }) => {
  const db = getDb();
  const user = await requireUser(db, request);
  const { tripId } = await params;
  return json(await getTrip({ db, user }, tripId));
});

/** DELETE /api/v1/trips/:tripId */
export const DELETE = route<Ctx>(async (request, { params }) => {
  const db = getDb();
  const user = await requireUser(db, request);
  const { tripId } = await params;
  await deleteTrip({ db, user }, tripId);
  return new Response(null, { status: 204 });
});
