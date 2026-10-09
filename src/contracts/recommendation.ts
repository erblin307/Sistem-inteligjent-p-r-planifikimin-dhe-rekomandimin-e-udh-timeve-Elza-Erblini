import type { TravelImage } from "./media";
import type { Money } from "./trip";

/**
 * Ranked catalog results for one trip, produced by the recommendation engine
 * (src/server/engines/recommendation). `source` is the catalog provenance:
 * "fixture" rows are development data, not real listings.
 */

export type HotelRecommendationResponse = {
  id: string;
  name: string;
  propertyType: "hotel" | "apartment" | "hostel" | "guesthouse";
  stars: number | null;
  area: string | null;
  rating: number | null;
  reviewCount: number;
  distanceToCentreM: number;
  amenities: string[];
  nightlyPrice: Money;
  nights: number;
  rooms: number;
  freeCancellation: boolean | null;
  /** The property's own photo, or null (the UI shows a neutral fallback). */
  image: TravelImage | null;
  source: string;
  eligible: boolean;
  score: number;
  reasons: string[];
};

export type ActivityRecommendationResponse = {
  id: string;
  name: string;
  category: { slug: string; name: string };
  rating: number | null;
  reviewCount: number;
  durationMinutes: number;
  pricePerPerson: Money;
  distanceToCentreM: number;
  /** The place's own photo, or null. */
  image: TravelImage | null;
  source: string;
  eligible: boolean;
  score: number;
  reasons: string[];
};

export type TripRecommendationsResponse = {
  hotels: HotelRecommendationResponse[];
  activities: ActivityRecommendationResponse[];
};
