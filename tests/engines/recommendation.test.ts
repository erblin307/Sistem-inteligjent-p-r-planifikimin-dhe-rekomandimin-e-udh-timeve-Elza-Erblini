import { describe, expect, it } from "vitest";

import {
  buildRecommendations,
  scoreActivity,
  scoreHotel,
  type ActivityCandidate,
  type HotelCandidate,
  type RecommendationProfile,
} from "@/server/engines/recommendation";

const profile: RecommendationProfile = {
  destination: "barcelona",
  currency: "EUR",
  totalBudgetMinor: 150_000,
  durationDays: 6,
  travelers: { adults: 2, children: 0 },
  hotelPreference: { minStars: 4 },
  travelStyle: "balanced",
  selectedActivities: ["architecture"],
  transportationPreference: { modes: ["walk", "public_transport"] },
  foodPreference: { diets: [], cuisines: [] },
};

const hotel = (override: Partial<HotelCandidate> = {}): HotelCandidate => ({
  id: "h",
  name: "Hotel",
  destination: "barcelona",
  currency: "EUR",
  nightlyPriceMinor: 10_000,
  stars: 4,
  type: "hotel",
  rating: 4.5,
  reviewCount: 2_000,
  distanceToCenterMeters: 800,
  nearbyActivityTags: ["architecture"],
  amenities: [],
  ...override,
});

const activity = (override: Partial<ActivityCandidate> = {}): ActivityCandidate => ({
  id: "a",
  name: "Activity",
  destination: "barcelona",
  currency: "EUR",
  pricePerPersonMinor: 2_000,
  rating: 4.5,
  reviewCount: 5_000,
  tags: ["architecture"],
  durationMinutes: 90,
  distanceToCenterMeters: 1_000,
  ...override,
});

describe("recommendation engine", () => {
  it("is deterministic and ranks the better fit first", () => {
    const input = {
      profile,
      hotels: [hotel({ id: "pricey", nightlyPriceMinor: 40_000 }), hotel({ id: "fits" })],
      activities: [activity({ id: "other", tags: ["nightlife"] }), activity({ id: "match" })],
    };
    const first = buildRecommendations(input);
    expect(buildRecommendations(input)).toEqual(first);
    expect(first.hotels.map((r) => r.candidate.id)).toEqual(["fits", "pricey"]);
    expect(first.activities.map((r) => r.candidate.id)).toEqual(["match", "other"]);
  });

  it("treats star preference as a minimum", () => {
    const four = scoreHotel(profile, hotel({ stars: 4 }));
    const five = scoreHotel(profile, hotel({ stars: 5 }));
    const three = scoreHotel(profile, hotel({ stars: 3 }));
    const pref = (r: typeof four) => r.breakdown.find((b) => b.key === "preferenceMatch")!.score;
    // At or above the minimum is never penalised for stars; below it is.
    expect(pref(four)).toBeGreaterThan(pref(three));
    expect(pref(five)).toBeGreaterThan(pref(three));
    expect(four.reasons).toContain("Meets your 4-star minimum.");
  });

  it("scores unclassified properties without failing", () => {
    const result = scoreHotel(profile, hotel({ stars: null, type: "apartment" }));
    expect(result.eligible).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });

  it("makes candidates in another destination or currency ineligible", () => {
    expect(scoreHotel(profile, hotel({ destination: "lisbon" })).eligible).toBe(false);
    expect(scoreActivity(profile, activity({ currency: "USD" })).eligible).toBe(false);
  });

  it("excludes food experiences that cannot meet a dietary requirement", () => {
    const vegetarian = { ...profile, foodPreference: { diets: ["vegetarian"], cuisines: [] } };
    const result = scoreActivity(vegetarian, activity({ isFoodExperience: true, tags: ["food"] }));
    expect(result.eligible).toBe(false);
    expect(result.reasons[0]).toMatch(/vegetarian/);
  });

  it("rejects an invalid profile", () => {
    expect(() => buildRecommendations({ profile: { ...profile, durationDays: 0 }, hotels: [], activities: [] })).toThrow(
      RangeError,
    );
  });
});
