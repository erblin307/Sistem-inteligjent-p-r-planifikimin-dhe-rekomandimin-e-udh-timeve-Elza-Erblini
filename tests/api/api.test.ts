import type { Pool } from "pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { Database } from "@/server/db/client";
import { activities, destinations, hotelAmenities, hotels } from "@/server/db/schema";
import { seedDevFixtures } from "@/server/db/seed/dev-fixtures";
import { setupTestDatabase, testDatabaseUrl } from "../db/harness";

/*
 * Exercises the real Route Handlers (request → validation → service →
 * Postgres → JSON) against the test database.
 */

const suite = testDatabaseUrl ? describe : describe.skip;
const BASE = "http://localhost:3000";

type Handler = (request: Request, context: { params: Promise<Record<string, string>> }) => Promise<Response>;

suite("API v1", () => {
  let db: Database;
  let pool: Pool;
  let barcelonaId: string;
  let tripsRoute: { GET: Handler; POST: Handler };
  let tripRoute: { GET: Handler; DELETE: Handler };
  let destinationsRoute: { GET: Handler };
  let destinationRoute: { GET: Handler };

  const call = (handler: Handler, request: Request, params: Record<string, string> = {}) =>
    handler(request, { params: Promise.resolve(params) });

  const postTrip = (body: unknown, headers: Record<string, string> = {}) =>
    call(
      tripsRoute.POST,
      new Request(`${BASE}/api/v1/trips`, {
        method: "POST",
        headers: { "content-type": "application/json", host: "localhost:3000", ...headers },
        body: typeof body === "string" ? body : JSON.stringify(body),
      }),
    );

  const get = (handler: Handler, path: string, params: Record<string, string> = {}) =>
    call(handler, new Request(`${BASE}${path}`), params);

  const brief = (override: Record<string, unknown> = {}) => ({
    destinationId: barcelonaId,
    startDate: "2027-07-12",
    days: 6,
    adults: 2,
    childAges: [7],
    budgetMinor: 150_000,
    currency: "EUR",
    travelStyle: "balanced",
    localTransportModes: ["walk", "public_transport"],
    interests: ["architecture", "food"],
    ...override,
  });

  beforeAll(async () => {
    vi.stubEnv("DATABASE_URL", testDatabaseUrl!);
    vi.stubEnv("DEV_AUTH_EMAIL", "traveler@example.test");
    ({ db, pool } = await setupTestDatabase());
    await seedDevFixtures(db);
    barcelonaId = (await db.query.destinations.findFirst())!.id;

    // A second destination so filters have something to exclude.
    const [lisbon] = await db
      .insert(destinations)
      .values({
        slug: "lisbon", name: "Lisbon", countryCode: "PT", region: "Lisbon", latitude: 38.7223,
        longitude: -9.1393, timezone: "Europe/Lisbon", currency: "EUR", source: "test",
      })
      .returning();
    const nature = await db.query.activityCategories.findFirst({ where: (c, { eq }) => eq(c.slug, "nature") });
    await db.insert(activities).values({
      destinationId: lisbon!.id, categoryId: nature!.id, name: "Monsanto Forest Park", latitude: 38.73,
      longitude: -9.19, durationMinutes: 120, adultPriceMinor: 0, currency: "EUR", source: "test",
    });
    const [pension] = await db
      .insert(hotels)
      .values({
        destinationId: lisbon!.id, name: "Test Pensão", stars: 2, latitude: 38.71, longitude: -9.14,
        nightlyPriceMinor: 6500, currency: "EUR", source: "test",
      })
      .returning();
    const wifi = await db.query.amenities.findFirst({ where: (a, { eq }) => eq(a.slug, "free-wifi") });
    await db.insert(hotelAmenities).values({ hotelId: pension!.id, amenityId: wifi!.id });
    // Inactive destinations never appear.
    await db.insert(destinations).values({
      slug: "atlantis", name: "Atlantis", countryCode: "GR", latitude: 36, longitude: 25,
      timezone: "Europe/Athens", currency: "EUR", source: "test", isActive: false,
    });

    tripsRoute = (await import("@/app/api/v1/trips/route")) as unknown as typeof tripsRoute;
    tripRoute = (await import("@/app/api/v1/trips/[tripId]/route")) as unknown as typeof tripRoute;
    destinationsRoute = (await import("@/app/api/v1/destinations/route")) as unknown as typeof destinationsRoute;
    destinationRoute = (await import("@/app/api/v1/destinations/[destination]/route")) as unknown as typeof destinationRoute;
  });

  beforeEach(() => {
    vi.stubEnv("DEV_AUTH_EMAIL", "traveler@example.test");
  });

  afterAll(async () => {
    const { getPool } = await import("@/server/db/client");
    await getPool().end();
    await pool?.end();
    vi.unstubAllEnvs();
  });

  describe("POST /api/v1/trips", () => {
    it("creates a trip from a brief and returns it", async () => {
      const res = await postTrip(brief({ dietaryRequirements: ["vegetarian"], minHotelStars: 3 }));
      expect(res.status).toBe(201);
      const trip = await res.json();
      expect(res.headers.get("location")).toBe(`/api/v1/trips/${trip.id}`);
      expect(res.headers.get("x-request-id")).toBeTruthy();
      expect(trip).toMatchObject({
        status: "draft",
        destination: { slug: "barcelona", timezone: "Europe/Madrid" },
        startDate: "2027-07-12",
        endDate: "2027-07-17",
        days: 6,
        nights: 5,
        travelers: { adults: 2, childAges: [7], total: 3 },
        budget: { amountMinor: 150_000, currency: "EUR", includesTransport: true },
        preferences: {
          travelStyle: "balanced",
          pace: "moderate",
          minHotelStars: 3,
          dietaryRequirements: ["vegetarian"],
          interests: [
            { slug: "architecture", name: "Architecture" },
            { slug: "food", name: "Food & markets" },
          ],
        },
      });
      expect(trip).not.toHaveProperty("userId");
    });

    it.each([
      ["negative budget", { budgetMinor: -100 }, "budgetMinor"],
      ["zero travelers", { adults: 0, childAges: [] }, "adults"],
      ["zero days", { days: 0 }, "days"],
      ["invalid date", { startDate: "2027-13-01" }, "startDate"],
      ["unsupported style", { travelStyle: "luxury" }, "travelStyle"],
      ["missing destination", { destinationId: undefined }, "destinationId"],
    ])("rejects %s with 422 and the field path", async (_label, override, path) => {
      const res = await postTrip(brief(override));
      expect(res.status).toBe(422);
      expect(res.headers.get("content-type")).toBe("application/problem+json");
      const problem = await res.json();
      expect(problem).toMatchObject({ status: 422, code: "VALIDATION_FAILED" });
      expect(problem.errors.map((e: { path: string }) => e.path)).toContain(path);
    });

    it("rejects interests that are not in the catalog", async () => {
      const problem = await (await postTrip(brief({ interests: ["architecture", "skydiving"] }))).json();
      expect(problem.errors).toEqual([{ path: "interests", message: "Unknown interests: skydiving." }]);
    });

    it("rejects a start date in the past at the destination", async () => {
      const problem = await (await postTrip(brief({ startDate: "2020-01-01" }))).json();
      expect(problem.errors[0].path).toBe("startDate");
    });

    it("rejects unknown and inactive destinations", async () => {
      const atlantis = await db.query.destinations.findFirst({ where: (d, { eq }) => eq(d.slug, "atlantis") });
      for (const destinationId of [crypto.randomUUID(), atlantis!.id]) {
        const problem = await (await postTrip(brief({ destinationId }))).json();
        expect(problem.errors).toEqual([{ path: "destinationId", message: "Choose a destination from the list." }]);
      }
    });

    it("rejects bodies that are not JSON, malformed or too large", async () => {
      expect((await postTrip("not json")).status).toBe(400);
      const wrongType = await call(
        tripsRoute.POST,
        new Request(`${BASE}/api/v1/trips`, { method: "POST", body: "a=1", headers: { "content-type": "text/plain" } }),
      );
      expect(wrongType.status).toBe(400);
      expect((await postTrip(JSON.stringify({ title: "x".repeat(70_000) }))).status).toBe(413);
    });

    it("rejects cross-site requests", async () => {
      const res = await postTrip(brief(), { origin: "https://evil.example" });
      expect(res.status).toBe(403);
      expect(await res.json()).toMatchObject({ code: "FORBIDDEN" });
      expect((await postTrip(brief(), { origin: BASE })).status).toBe(201);
    });

    it("requires a signed-in user", async () => {
      vi.stubEnv("DEV_AUTH_EMAIL", undefined);
      const res = await postTrip(brief());
      expect(res.status).toBe(401);
      expect(await res.json()).toMatchObject({ code: "UNAUTHENTICATED", detail: "Sign in to continue." });
    });
  });

  describe("trips by id", () => {
    it("lists, reads and deletes the user's trip", async () => {
      const created = await (await postTrip(brief({ title: "Summer in Barcelona" }))).json();

      const list = await (await get(tripsRoute.GET, "/api/v1/trips")).json();
      expect(list.items.some((t: { id: string; days: number }) => t.id === created.id && t.days === 6)).toBe(true);

      const read = await get(tripRoute.GET, `/api/v1/trips/${created.id}`, { tripId: created.id });
      expect(read.status).toBe(200);
      expect((await read.json()).title).toBe("Summer in Barcelona");

      const del = await call(
        tripRoute.DELETE,
        new Request(`${BASE}/api/v1/trips/${created.id}`, { method: "DELETE" }),
        { tripId: created.id },
      );
      expect(del.status).toBe(204);
      expect((await get(tripRoute.GET, `/api/v1/trips/${created.id}`, { tripId: created.id })).status).toBe(404);
    });

    it("answers 404 for other users' trips and malformed ids", async () => {
      const created = await (await postTrip(brief())).json();
      vi.stubEnv("DEV_AUTH_EMAIL", "someone-else@example.test");
      const other = await get(tripRoute.GET, `/api/v1/trips/${created.id}`, { tripId: created.id });
      expect(other.status).toBe(404);
      expect(await other.json()).toMatchObject({ code: "TRIP_NOT_FOUND" });
      expect((await get(tripRoute.GET, "/api/v1/trips/not-a-uuid", { tripId: "not-a-uuid" })).status).toBe(404);
    });
  });

  describe("GET /api/v1/destinations", () => {
    const names = async (query: string) => {
      const res = await get(destinationsRoute.GET, `/api/v1/destinations${query}`);
      expect(res.status).toBe(200);
      return ((await res.json()).items as { name: string }[]).map((d) => d.name);
    };

    it("lists active destinations alphabetically with catalog statistics", async () => {
      const body = await (await get(destinationsRoute.GET, "/api/v1/destinations")).json();
      expect(body.items.map((d: { name: string }) => d.name)).toEqual(["Barcelona", "Lisbon"]);
      expect(body.nextCursor).toBeNull();
      expect(body.items[0]).toMatchObject({
        slug: "barcelona",
        countryCode: "ES",
        hotels: {
          count: 2,
          nightlyFrom: { amountMinor: 11_800, currency: "EUR" },
          nightlyMedian: { amountMinor: 13_000, currency: "EUR" },
        },
        activities: { count: 3, categories: ["architecture", "food", "museums"] },
      });
    });

    it.each([
      ["?country=pt", ["Lisbon"]],
      ["?q=barc", ["Barcelona"]],
      ["?q=es", ["Barcelona"]],
      ["?city=LISBON", ["Lisbon"]],
      ["?interest=architecture", ["Barcelona"]],
      ["?interest=architecture,nature", []],
      ["?interest=nature", ["Lisbon"]],
      ["?minStars=4", ["Barcelona"]],
      ["?amenity=free-wifi", ["Barcelona", "Lisbon"]],
      ["?amenity=free-wifi&amenity=rooftop-terrace", []],
      ["?maxNightlyPriceMinor=10000&currency=EUR", ["Lisbon"]],
      ["?minStars=3&maxNightlyPriceMinor=12000&currency=EUR", ["Barcelona"]],
      ["?q=100%25", []],
    ])("filters %s", async (query, expected) => {
      expect(await names(query)).toEqual(expected);
    });

    it("pages with a cursor", async () => {
      const first = await (await get(destinationsRoute.GET, "/api/v1/destinations?limit=1")).json();
      expect(first.items.map((d: { name: string }) => d.name)).toEqual(["Barcelona"]);
      const second = await (
        await get(destinationsRoute.GET, `/api/v1/destinations?limit=1&cursor=${first.nextCursor}`)
      ).json();
      expect(second.items.map((d: { name: string }) => d.name)).toEqual(["Lisbon"]);
      expect(second.nextCursor).toBeNull();
    });

    it.each([
      ["?interest=skydiving", "interest"],
      ["?amenity=helipad", "amenity"],
      ["?maxNightlyPriceMinor=10000", "currency"],
      ["?country=Spain", "country"],
      ["?limit=500", "limit"],
      ["?cursor=garbage", "cursor"],
    ])("rejects %s", async (query, path) => {
      const res = await get(destinationsRoute.GET, `/api/v1/destinations${query}`);
      expect(res.status).toBe(422);
      expect((await res.json()).errors.map((e: { path: string }) => e.path)).toContain(path);
    });
  });

  describe("GET /api/v1/destinations/:destination", () => {
    it("finds a destination by slug or id with category counts", async () => {
      const bySlug = await (await get(destinationRoute.GET, "/api/v1/destinations/barcelona", { destination: "barcelona" })).json();
      expect(bySlug.activities.categories).toEqual([
        { slug: "architecture", name: "Architecture", count: 1 },
        { slug: "food", name: "Food & markets", count: 1 },
        { slug: "museums", name: "Museums", count: 1 },
      ]);
      const byId = await (await get(destinationRoute.GET, `/api/v1/destinations/${barcelonaId}`, { destination: barcelonaId })).json();
      expect(byId.slug).toBe("barcelona");
    });

    it("answers 404 for unknown and inactive destinations", async () => {
      for (const destination of ["atlantis", "nowhere", crypto.randomUUID(), "bad slug!"]) {
        const res = await get(destinationRoute.GET, `/api/v1/destinations/${destination}`, { destination });
        expect(res.status).toBe(404);
        expect((await res.json()).code).toBe("DESTINATION_NOT_FOUND");
      }
    });
  });
});
