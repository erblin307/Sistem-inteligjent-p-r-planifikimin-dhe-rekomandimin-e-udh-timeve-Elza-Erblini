import { eq, sql } from "drizzle-orm";
import type { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createTripInput } from "@/contracts/trip";
import type { Database } from "@/server/db/client";
import {
  activities,
  activityCategories,
  budgetLines,
  destinations,
  hotels,
  itineraries,
  itineraryDays,
  itineraryItems,
  recommendations,
  savedPlaces,
  tripInterests,
  trips,
  userPreferences,
  users,
} from "@/server/db/schema";
import { seedDevFixtures } from "@/server/db/seed/dev-fixtures";
import {
  UnknownInterestError,
  createTrip,
  deleteTripForOwner,
  getTripForOwner,
  listTripsForOwner,
} from "@/server/modules/trips";
import { PG, pgError, setupTestDatabase, testDatabaseUrl } from "./harness";

const suite = testDatabaseUrl ? describe : describe.skip;

suite("database schema", () => {
  let db: Database;
  let pool: Pool;
  let ownerId: string;
  let otherUserId: string;
  let destinationId: string;
  let hotelId: string;
  let activityId: string;

  const brief = () =>
    createTripInput.parse({
      destinationId,
      startDate: "2027-07-12",
      endDate: "2027-07-17",
      adults: 2,
      childAges: [7],
      budgetMinor: 150_000,
      currency: "EUR",
      travelStyle: "balanced",
      localTransportModes: ["walk", "public_transport"],
      dietaryRequirements: ["vegetarian"],
      interests: ["architecture", "food"],
    });

  beforeAll(async () => {
    ({ db, pool } = await setupTestDatabase());
    await seedDevFixtures(db);
    const [owner, other] = await db
      .insert(users)
      .values([{ email: "owner@example.test" }, { email: "other@example.test" }])
      .returning();
    ownerId = owner!.id;
    otherUserId = other!.id;
    destinationId = (await db.query.destinations.findFirst())!.id;
    hotelId = (await db.query.hotels.findFirst())!.id;
    activityId = (await db.query.activities.findFirst())!.id;
  });

  afterAll(async () => {
    await pool?.end();
  });

  describe("trips repository", () => {
    it("creates a trip with interests and reads it back with derived counts", async () => {
      const trip = await createTrip(db, ownerId, brief());
      const read = await getTripForOwner(db, ownerId, trip.id);

      expect(read).not.toBeNull();
      expect(read!.destination.slug).toBe("barcelona");
      expect(read!.interests.map((i) => i.slug)).toEqual(["architecture", "food"]);
      expect(read!).toMatchObject({ days: 6, nights: 5, children: 1, travelers: 3 });
      // Dates come back exactly as written, independent of the server time zone.
      expect(read!.startDate).toBe("2027-07-12");
      expect(read!.endDate).toBe("2027-07-17");
      // Money is integer minor units.
      expect(read!.budgetMinor).toBe(150_000);
      expect(Number.isInteger(read!.budgetMinor)).toBe(true);
      expect(read!.localTransportModes).toEqual(["walk", "public_transport"]);
      expect(read!.status).toBe("draft");
    });

    it("hides trips from other users", async () => {
      const trip = await createTrip(db, ownerId, brief());
      expect(await getTripForOwner(db, otherUserId, trip.id)).toBeNull();
      expect(await deleteTripForOwner(db, otherUserId, trip.id)).toBe(false);
      expect((await listTripsForOwner(db, otherUserId)).length).toBe(0);
    });

    it("rejects unknown interests without writing a trip", async () => {
      const before = (await listTripsForOwner(db, ownerId)).length;
      await expect(
        createTrip(db, ownerId, { ...brief(), interests: ["architecture", "skydiving"] }),
      ).rejects.toBeInstanceOf(UnknownInterestError);
      expect((await listTripsForOwner(db, ownerId)).length).toBe(before);
    });
  });

  describe("catalog", () => {
    it("returns ratings as numbers and prices as integer minor units", async () => {
      const hotel = await db.query.hotels.findFirst({ where: eq(hotels.id, hotelId) });
      expect(typeof hotel!.rating).toBe("number");
      expect(Number.isInteger(hotel!.nightlyPriceMinor)).toBe(true);
    });

    it("keeps one row per provider record", async () => {
      const result = await pgError(
        db.insert(hotels).values({
          destinationId,
          name: "Duplicate",
          latitude: 41.4,
          longitude: 2.16,
          currency: "EUR",
          source: "fixture",
          externalId: "h1",
        }),
      );
      expect(result).toEqual({ code: PG.uniqueViolation, constraint: "hotels_source_external_id_key" });
    });

    it.each([
      ["stars", { stars: 6 }, "hotels_stars_range"],
      ["rating", { rating: 5.5 }, "hotels_rating_range"],
      ["negative price", { nightlyPriceMinor: -1 }, "hotels_nightly_price_nonnegative"],
      ["latitude", { latitude: 120 }, "hotels_latitude_range"],
      ["currency", { currency: "eur" }, "hotels_currency_format"],
    ])("rejects an invalid hotel %s", async (_label, override, constraint) => {
      const result = await pgError(
        db.insert(hotels).values({
          destinationId,
          name: "Invalid",
          latitude: 41.4,
          longitude: 2.16,
          currency: "EUR",
          source: "test",
          ...override,
        }),
      );
      expect(result).toEqual({ code: PG.checkViolation, constraint });
    });

    it("does not let a destination with hotels be deleted", async () => {
      const result = await pgError(db.delete(destinations).where(eq(destinations.id, destinationId)));
      expect(result.code).toBe(PG.foreignKeyViolation);
    });

    it("does not let a category in use be deleted", async () => {
      const result = await pgError(
        db.delete(activityCategories).where(eq(activityCategories.slug, "architecture")),
      );
      expect(result.code).toBe(PG.foreignKeyViolation);
    });
  });

  describe("trip constraints", () => {
    const row = () => ({
      userId: ownerId,
      destinationId,
      startDate: "2027-07-12",
      endDate: "2027-07-17",
      adults: 2,
      budgetMinor: 150_000,
      currency: "EUR",
      travelStyle: "balanced" as const,
      localTransportModes: ["walk" as const],
    });

    it.each([
      ["end before start", { endDate: "2027-07-10" }, "trips_dates_order"],
      ["no adults", { adults: 0 }, "trips_adults_min"],
      ["child age 18", { childAges: [18] }, "trips_child_ages_range"],
      ["party over 10", { adults: 9, childAges: [4, 6] }, "trips_party_size_max"],
      ["negative budget", { budgetMinor: -100 }, "trips_budget_nonnegative"],
      ["no transport mode", { localTransportModes: [] }, "trips_local_transport_not_empty"],
      ["hotel stars 0", { minHotelStars: 0 }, "trips_min_hotel_stars_range"],
      ["half a coordinate", { departureLatitude: 42.66 }, "trips_departure_coordinates_pair"],
    ])("rejects %s", async (_label, override, constraint) => {
      const result = await pgError(db.insert(trips).values({ ...row(), ...override }));
      expect(result).toEqual({ code: PG.checkViolation, constraint });
    });

    it("rejects a NULL child age", async () => {
      const result = await pgError(
        db.execute(sql`
          INSERT INTO trips (user_id, destination_id, start_date, end_date, adults, child_ages,
            budget_minor, currency, travel_style, local_transport_modes)
          VALUES (${ownerId}, ${destinationId}, '2027-07-12', '2027-07-17', 2, ARRAY[NULL]::smallint[],
            1000, 'EUR', 'balanced', ARRAY['walk']::local_transport_mode[])`),
      );
      expect(result.constraint).toBe("trips_child_ages_range");
    });
  });

  describe("itineraries", () => {
    async function newItinerary(tripId: string, version = 1) {
      const [it] = await db
        .insert(itineraries)
        .values({ tripId, version, currency: "EUR", engineVersion: "test", scoringVersion: "test", hotelId })
        .returning();
      return it!;
    }

    it("allows one active itinerary per trip and unique day numbers", async () => {
      const trip = await createTrip(db, ownerId, brief());
      const first = await newItinerary(trip.id, 1);

      const secondActive = await pgError(newItinerary(trip.id, 2));
      expect(secondActive).toEqual({ code: PG.uniqueViolation, constraint: "itineraries_one_active_per_trip" });

      await db.update(itineraries).set({ status: "superseded" }).where(eq(itineraries.id, first.id));
      await newItinerary(trip.id, 2);

      await db.insert(itineraryDays).values({ itineraryId: first.id, dayNumber: 1, date: "2027-07-12" });
      const duplicateDay = await pgError(
        db.insert(itineraryDays).values({ itineraryId: first.id, dayNumber: 1, date: "2027-07-13" }),
      );
      expect(duplicateDay.constraint).toBe("itinerary_days_itinerary_id_day_number_key");
    });

    it("requires items to reference what their type says", async () => {
      const trip = await createTrip(db, ownerId, brief());
      const itinerary = await newItinerary(trip.id);
      const [day] = await db
        .insert(itineraryDays)
        .values({ itineraryId: itinerary.id, dayNumber: 1, date: "2027-07-12" })
        .returning();
      const base = { dayId: day!.id, startTime: "10:30", durationMinutes: 90 };

      await db.insert(itineraryItems).values({ ...base, position: 0, type: "activity", activityId, estimatedCostMinor: 3500 });
      await db.insert(itineraryItems).values({ ...base, position: 1, type: "meal", title: "Lunch", estimatedCostMinor: 4600, travelMode: "walk", travelMinutes: 6, travelMeters: 450 });

      for (const bad of [
        { position: 2, type: "activity" as const },
        { position: 3, type: "meal" as const },
        { position: 4, type: "meal" as const, title: "Dinner", activityId },
        { position: 5, type: "hotel" as const, activityId },
      ]) {
        const result = await pgError(db.insert(itineraryItems).values({ ...base, ...bad }));
        expect(result.constraint).toBe("itinerary_items_reference_matches_type");
      }

      const duplicatePosition = await pgError(
        db.insert(itineraryItems).values({ ...base, position: 0, type: "free", title: "Beach" }),
      );
      expect(duplicatePosition.constraint).toBe("itinerary_items_day_id_position_key");

      const halfLeg = await pgError(
        db.insert(itineraryItems).values({ ...base, position: 6, type: "free", title: "Walk", travelMode: "walk" }),
      );
      expect(halfLeg.constraint).toBe("itinerary_items_travel_complete");
    });

    it("validates budget lines and recommendations", async () => {
      const trip = await createTrip(db, ownerId, brief());
      const itinerary = await newItinerary(trip.id);

      await db.insert(budgetLines).values({ itineraryId: itinerary.id, category: "food", plannedMinor: 24000, lowMinor: 20000, highMinor: 30000 });
      const duplicateCategory = await pgError(
        db.insert(budgetLines).values({ itineraryId: itinerary.id, category: "food", plannedMinor: 1, lowMinor: 1, highMinor: 1 }),
      );
      expect(duplicateCategory.constraint).toBe("budget_lines_itinerary_id_category_key");
      const badRange = await pgError(
        db.insert(budgetLines).values({ itineraryId: itinerary.id, category: "reserve", plannedMinor: 100, lowMinor: 200, highMinor: 300 }),
      );
      expect(badRange.constraint).toBe("budget_lines_range_order");

      await db.insert(recommendations).values({ itineraryId: itinerary.id, kind: "hotel", hotelId, rank: 1, score: 92, breakdown: { budgetFit: 1, quality: 0.84 }, reasons: ["UNDER_BUDGET"], priceMinor: 14200 });
      const stored = await db.query.recommendations.findFirst({ where: eq(recommendations.itineraryId, itinerary.id) });
      expect(stored!.breakdown).toEqual({ budgetFit: 1, quality: 0.84 });

      const wrongTarget = await pgError(
        db.insert(recommendations).values({ itineraryId: itinerary.id, kind: "hotel", activityId, rank: 2, score: 50, breakdown: {} }),
      );
      expect(wrongTarget.constraint).toBe("recommendations_reference_matches_kind");
      const badScore = await pgError(
        db.insert(recommendations).values({ itineraryId: itinerary.id, kind: "activity", activityId, rank: 1, score: 101, breakdown: {} }),
      );
      expect(badScore.constraint).toBe("recommendations_score_range");
    });

    it("protects catalog rows that a plan references", async () => {
      const result = await pgError(db.delete(hotels).where(eq(hotels.id, hotelId)));
      expect(result.code).toBe(PG.foreignKeyViolation);
    });
  });

  describe("saved places", () => {
    it("stores exactly one target and ignores duplicates by constraint", async () => {
      await db.insert(savedPlaces).values({ userId: ownerId, hotelId });
      const duplicate = await pgError(db.insert(savedPlaces).values({ userId: ownerId, hotelId }));
      expect(duplicate.constraint).toBe("saved_places_user_hotel_key");

      const two = await pgError(db.insert(savedPlaces).values({ userId: ownerId, hotelId, activityId }));
      expect(two.constraint).toBe("saved_places_exactly_one_target");
      const none = await pgError(db.insert(savedPlaces).values({ userId: ownerId }));
      expect(none.constraint).toBe("saved_places_exactly_one_target");
    });
  });

  describe("cascades", () => {
    it("deleting a user removes their data and keeps the shared catalog", async () => {
      const [user] = await db.insert(users).values({ email: "leaving@example.test" }).returning();
      const userId = user!.id;
      await db.insert(userPreferences).values({ userId, travelStyle: "comfort" });
      const trip = await createTrip(db, userId, brief());
      const [itinerary] = await db
        .insert(itineraries)
        .values({ tripId: trip.id, version: 1, currency: "EUR", engineVersion: "t", scoringVersion: "t", hotelId })
        .returning();
      const [day] = await db
        .insert(itineraryDays)
        .values({ itineraryId: itinerary!.id, dayNumber: 1, date: "2027-07-12" })
        .returning();
      await db.insert(itineraryItems).values({ dayId: day!.id, position: 0, type: "activity", activityId, startTime: "10:00", durationMinutes: 60 });
      await db.insert(budgetLines).values({ itineraryId: itinerary!.id, category: "activities", plannedMinor: 3500, lowMinor: 3500, highMinor: 3500 });
      await db.insert(recommendations).values({ itineraryId: itinerary!.id, kind: "activity", activityId, rank: 1, score: 90, breakdown: {} });
      await db.insert(savedPlaces).values({ userId, activityId });

      await db.delete(users).where(eq(users.id, userId));

      const count = async (table: Parameters<Database["$count"]>[0], where?: Parameters<Database["$count"]>[1]) =>
        db.$count(table, where);
      expect(await count(userPreferences, eq(userPreferences.userId, userId))).toBe(0);
      expect(await count(trips, eq(trips.userId, userId))).toBe(0);
      expect(await count(tripInterests, eq(tripInterests.tripId, trip.id))).toBe(0);
      expect(await count(itineraries, eq(itineraries.tripId, trip.id))).toBe(0);
      expect(await count(itineraryDays, eq(itineraryDays.itineraryId, itinerary!.id))).toBe(0);
      expect(await count(itineraryItems, eq(itineraryItems.dayId, day!.id))).toBe(0);
      expect(await count(budgetLines, eq(budgetLines.itineraryId, itinerary!.id))).toBe(0);
      expect(await count(recommendations, eq(recommendations.itineraryId, itinerary!.id))).toBe(0);
      expect(await count(savedPlaces, eq(savedPlaces.userId, userId))).toBe(0);

      expect(await count(hotels, eq(hotels.id, hotelId))).toBe(1);
      expect(await count(activities, eq(activities.id, activityId))).toBe(1);
      expect(await count(destinations, eq(destinations.id, destinationId))).toBe(1);
    });
  });
});
