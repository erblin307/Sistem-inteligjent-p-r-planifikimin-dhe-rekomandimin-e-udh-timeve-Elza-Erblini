import { getDb } from "@/server/db/client";
import { getDestination } from "@/server/modules/destinations";
import { json, route } from "@/server/platform/http";

type Ctx = RouteContext<"/api/v1/destinations/[destination]">;

/** GET /api/v1/destinations/:destination — by id or slug ("barcelona"). */
export const GET = route<Ctx>(async (_request, { params }) => {
  const { destination } = await params;
  return json(await getDestination({ db: getDb() }, destination));
});
