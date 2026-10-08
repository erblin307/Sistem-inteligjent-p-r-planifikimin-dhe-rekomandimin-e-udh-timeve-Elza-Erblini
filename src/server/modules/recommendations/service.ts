import type {
  ActivityRecommendationResponse,
  HotelRecommendationResponse,
  TripRecommendationsResponse,
} from "@/contracts/recommendation";
import type { TripResponse } from "@/contracts/trip";
import type { Database } from "@/server/db/client";
import {
  buildRecommendations,
  type ActivityCandidate,
  type HotelCandidate,
  type RecommendationProfile,
} from "@/server/engines/recommendation";
import { findDestinationCentre, listActivityCandidates, listHotelCandidates } from "./repo";

/**
 * Connects a saved trip to the recommendation engine: loads the trip
 * destination's catalog, maps rows onto engine candidates and maps the ranked
 * results back to response shapes.
 *
 * The catalog has no travel times or dietary data yet, so location uses
 * straight-line distance to the destination centre, a hotel's nearby activity
 * tags are the categories within NEARBY_METERS, and food experiences carry no
 * dietary options. Rows without a known price are left out because the
 * engine's budget score needs one.
 */

type Ctx = { db: Database };

const NEARBY_METERS = 1_500;

export async function recommendForTrip(ctx: Ctx, trip: TripResponse): Promise<TripRecommendationsResponse> {
  const [centre, hotelRows, activityRows] = await Promise.all([
    findDestinationCentre(ctx.db, trip.destination.id),
    listHotelCandidates(ctx.db, trip.destination.id),
    listActivityCandidates(ctx.db, trip.destination.id),
  ]);
  if (!centre) return { hotels: [], activities: [] };

  const pricedActivities = activityRows.filter((a) => a.adultPriceMinor !== null);
  const pricedHotels = hotelRows.filter((h) => h.nightlyPriceMinor !== null);

  const hotelCandidates: HotelCandidate[] = pricedHotels.map((h) => ({
    id: h.id,
    name: h.name,
    destination: trip.destination.id,
    currency: h.currency,
    nightlyPriceMinor: h.nightlyPriceMinor as number,
    stars: (h.stars ?? null) as HotelCandidate["stars"],
    type: h.propertyType,
    rating: h.rating ?? 0,
    reviewCount: h.reviewCount,
    distanceToCenterMeters: distanceMeters(centre, h),
    nearbyActivityTags: [
      ...new Set(
        pricedActivities.filter((a) => distanceMeters(h, a) <= NEARBY_METERS).map((a) => a.categorySlug),
      ),
    ],
    amenities: h.amenities.map((a) => a.amenity.name),
    maxGuestsPerRoom: h.maxOccupancy,
  }));

  const activityCandidates: ActivityCandidate[] = pricedActivities.map((a) => ({
    id: a.id,
    name: a.name,
    destination: trip.destination.id,
    currency: a.currency,
    pricePerPersonMinor: a.adultPriceMinor as number,
    rating: a.rating ?? 0,
    reviewCount: a.reviewCount,
    tags: [a.categorySlug],
    durationMinutes: a.durationMinutes,
    distanceToCenterMeters: distanceMeters(centre, a),
    isFoodExperience: a.categorySlug === "food",
  }));

  const result = buildRecommendations({
    profile: toProfile(trip),
    hotels: hotelCandidates,
    activities: activityCandidates,
  });

  const hotelById = new Map(pricedHotels.map((h) => [h.id, h]));
  const activityById = new Map(pricedActivities.map((a) => [a.id, a]));
  const nights = Math.max(1, trip.nights);

  return {
    hotels: result.hotels.map(({ candidate, eligible, score, reasons }): HotelRecommendationResponse => {
      const row = hotelById.get(candidate.id)!;
      return {
        id: row.id,
        name: row.name,
        propertyType: row.propertyType,
        stars: row.stars,
        area: row.area,
        rating: row.rating,
        reviewCount: row.reviewCount,
        distanceToCentreM: Math.round(candidate.distanceToCenterMeters),
        amenities: candidate.amenities,
        nightlyPrice: { amountMinor: candidate.nightlyPriceMinor, currency: row.currency },
        nights,
        rooms: Math.max(1, Math.ceil(trip.travelers.total / row.maxOccupancy)),
        freeCancellation: row.freeCancellation,
        imageUrl: row.imageUrl,
        source: row.source,
        eligible,
        score,
        reasons,
      };
    }),
    activities: result.activities.map(({ candidate, eligible, score, reasons }): ActivityRecommendationResponse => {
      const row = activityById.get(candidate.id)!;
      return {
        id: row.id,
        name: row.name,
        category: { slug: row.categorySlug, name: row.categoryName },
        rating: row.rating,
        reviewCount: row.reviewCount,
        durationMinutes: row.durationMinutes,
        pricePerPerson: { amountMinor: candidate.pricePerPersonMinor, currency: row.currency },
        distanceToCentreM: Math.round(candidate.distanceToCenterMeters),
        imageUrl: row.imageUrl,
        source: row.source,
        eligible,
        score,
        reasons,
      };
    }),
  };
}

export function toProfile(trip: TripResponse): RecommendationProfile {
  const stars = trip.preferences.minHotelStars;
  return {
    destination: trip.destination.id,
    currency: trip.budget.currency,
    totalBudgetMinor: trip.budget.amountMinor,
    durationDays: trip.days,
    travelers: { adults: trip.travelers.adults, children: trip.travelers.childAges.length },
    hotelPreference: {
      ...(stars ? { minStars: stars as 1 | 2 | 3 | 4 | 5 } : {}),
      ...(trip.preferences.accommodationType ? { type: trip.preferences.accommodationType } : {}),
    },
    travelStyle: trip.preferences.travelStyle,
    selectedActivities: trip.preferences.interests.map((i) => i.slug),
    transportationPreference: { modes: trip.preferences.localTransportModes },
    foodPreference: { diets: trip.preferences.dietaryRequirements, cuisines: [] },
  };
}

/** Great-circle distance in metres (haversine). */
export function distanceMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
