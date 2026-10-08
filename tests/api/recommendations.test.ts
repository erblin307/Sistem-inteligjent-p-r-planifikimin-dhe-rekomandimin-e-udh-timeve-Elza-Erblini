import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import type { TripRecommendationsResponse } from "@/contracts/recommendation";
import { seedDevFixtures } from "@/server/db/seed/dev-fixtures";
import { initialTripFormState, toCreateTripInput } from "@/lib/trip-form";
import { setupTestDatabase, testDatabaseUrl } from "../db/harness";

/*
 * The full Claude/Codex join: the plan form's payload goes through the trips
 * API into Postgres, and the saved trip drives the recommendation engine over
 * the destination's catalog.
 */

const suite = testDatabaseUrl ? describe : describe.skip;
const BASE = "http://localhost:3000";

type Handler = (request: Request, context: { params: Promise<Record<string, string>> }) => Promise<Response>;

suite("plan form → trip → recommendations", () => {
  let pool: Pool;
  let barcelonaId: string;
  let tripsRoute: { POST: Handler };
  let recommendationsRoute: { GET: Handler };

  const createTrip = async (override: Partial<ReturnType<typeof initialTripFormState>> = {}) => {
    const form = {
      ...initialTripFormState(barcelonaId),
      departureCity: "Prishtina",
      startDate: "2027-08-03",
      endDate: "2027-08-05",
      adults: 3,
      budget: "900",
      interests: ["museums"],
      ...override,
    };
    const res = await tripsRoute.POST(
      new Request(`${BASE}/api/v1/trips`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: BASE, host: "localhost:3000" },
        body: JSON.stringify(toCreateTripInput(form)),
      }),
      { params: Promise.resolve({}) },
    );
    return res;
  };

  const recommendations = async (tripId: string) => {
    const res = await recommendationsRoute.GET(new Request(`${BASE}/api/v1/trips/${tripId}/recommendations`), {
      params: Promise.resolve({ tripId }),
    });
    return { status: res.status, body: (await res.json()) as TripRecommendationsResponse };
  };

  beforeAll(async () => {
    vi.stubEnv("DATABASE_URL", testDatabaseUrl!);
    vi.stubEnv("DEV_AUTH_EMAIL", "planner@example.test");
    let db;
    ({ db, pool } = await setupTestDatabase());
    await seedDevFixtures(db);
    barcelonaId = (await db.query.destinations.findFirst())!.id;
    tripsRoute = (await import("@/app/api/v1/trips/route")) as unknown as typeof tripsRoute;
    recommendationsRoute = (await import(
      "@/app/api/v1/trips/[tripId]/recommendations/route"
    )) as unknown as typeof recommendationsRoute;
  });

  afterAll(async () => {
    const { getPool } = await import("@/server/db/client");
    await getPool().end();
    await pool?.end();
    vi.unstubAllEnvs();
  });

  it("saves the form's trip exactly as entered", async () => {
    const res = await createTrip();
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({
      destination: { slug: "barcelona" },
      startDate: "2027-08-03",
      endDate: "2027-08-05",
      days: 3,
      travelers: { adults: 3, total: 3 },
      departure: { city: "Prishtina" },
      budget: { amountMinor: 90_000, currency: "EUR" },
      preferences: { interests: [{ slug: "museums" }], localTransportModes: ["walk", "public_transport"] },
    });
  });

  it("ranks the destination's catalog for the saved trip", async () => {
    const trip = await (await createTrip()).json();
    const { status, body } = await recommendations(trip.id);
    expect(status).toBe(200);

    expect(body.hotels.length).toBeGreaterThan(0);
    expect(body.hotels[0]).toMatchObject({ eligible: true, nights: 2, source: "fixture" });
    // Three travelers in rooms for two.
    expect(body.hotels[0]!.rooms).toBe(2);
    const scores = body.hotels.map((h) => h.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));

    // The museums interest puts the museum first among activities.
    expect(body.activities[0]).toMatchObject({ name: "Picasso Museum", category: { slug: "museums" } });
    expect(body.activities[0]!.reasons.join(" ")).toMatch(/museums/);
  });

  it("follows the trip's preferences: a dietary requirement excludes unverified food experiences", async () => {
    const trip = await (await createTrip({ dietaryRequirements: ["vegetarian"], interests: ["food"] })).json();
    const { body } = await recommendations(trip.id);
    const market = body.activities.find((a) => a.category.slug === "food");
    expect(market).toMatchObject({ eligible: false });
    expect(market!.reasons[0]).toMatch(/vegetarian/);
  });

  it("does not reveal recommendations for an unknown trip", async () => {
    const res = await recommendationsRoute.GET(new Request(`${BASE}/api/v1/trips/x/recommendations`), {
      params: Promise.resolve({ tripId: "00000000-0000-4000-8000-000000000000" }),
    });
    expect(res.status).toBe(404);
  });
});
