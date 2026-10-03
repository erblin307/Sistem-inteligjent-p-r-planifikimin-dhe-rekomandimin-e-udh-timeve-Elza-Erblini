import { listDestinationsQuery } from "@/contracts/destination";
import { getDb } from "@/server/db/client";
import { searchDestinations } from "@/server/modules/destinations";
import { json, parseQuery, route } from "@/server/platform/http";

/**
 * GET /api/v1/destinations
 *   ?q= &country= &city= &interest= &minStars= &amenity= &maxNightlyPriceMinor= &currency=
 *   &cursor= &limit=
 */
export const GET = route(async (request) => {
  const query = parseQuery(request, listDestinationsQuery);
  return json(await searchDestinations({ db: getDb() }, query));
});
