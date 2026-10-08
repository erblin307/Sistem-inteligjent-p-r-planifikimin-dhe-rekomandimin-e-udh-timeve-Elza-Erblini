import type { accommodationTypes, localTransportModes, travelStyles } from "@/contracts/trip";

/** Vocabularies come from the trip contract so profiles map 1:1 from a saved trip. */
export type TravelStyle = (typeof travelStyles)[number];
export type HotelType = (typeof accommodationTypes)[number];
export type TransportationMode = (typeof localTransportModes)[number];

export type Travelers = {
  adults: number;
  children: number;
};

export type HotelPreference = {
  /** Minimum official class; hotels at or above it fully match. */
  minStars?: 1 | 2 | 3 | 4 | 5;
  type?: HotelType;
  maxNightlyPriceMinor?: number;
};

export type TransportationPreference = {
  modes: TransportationMode[];
  maxWalkMinutes?: number;
};

export type FoodPreference = {
  diets: string[];
  cuisines: string[];
};

export type RecommendationProfile = {
  destination: string;
  currency: string;
  totalBudgetMinor: number;
  durationDays: number;
  travelers: Travelers;
  hotelPreference: HotelPreference;
  travelStyle: TravelStyle;
  selectedActivities: string[];
  transportationPreference: TransportationPreference;
  foodPreference: FoodPreference;
};

export type TravelTimes = Partial<Record<TransportationMode, number>>;

export type HotelCandidate = {
  id: string;
  name: string;
  destination: string;
  currency: string;
  nightlyPriceMinor: number;
  /** Null for unclassified properties such as apartments. */
  stars: 1 | 2 | 3 | 4 | 5 | null;
  type: HotelType;
  rating: number;
  reviewCount: number;
  distanceToCenterMeters: number;
  travelMinutesToCenter?: TravelTimes;
  nearbyActivityTags: string[];
  amenities: string[];
  dietaryOptions?: string[];
  cuisineTags?: string[];
  maxGuestsPerRoom?: number;
};

export type ActivityCandidate = {
  id: string;
  name: string;
  destination: string;
  currency: string;
  pricePerPersonMinor: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  suitableTravelStyles?: TravelStyle[];
  durationMinutes: number;
  distanceToCenterMeters: number;
  travelMinutesFromCenter?: TravelTimes;
  isFoodExperience?: boolean;
  dietaryOptions?: string[];
  cuisineTags?: string[];
  minGroupSize?: number;
  maxGroupSize?: number;
};

export type RecommendationEngineInput = {
  profile: RecommendationProfile;
  hotels: HotelCandidate[];
  activities: ActivityCandidate[];
};

export type ScoreComponentKey =
  | "budgetMatch"
  | "preferenceMatch"
  | "locationMatch"
  | "activityMatch"
  | "ratingScore"
  | "foodMatch";

export type ScoreComponent = {
  key: ScoreComponentKey;
  label: string;
  score: number;
  weight: number;
  contribution: number;
};

export type Recommendation<T> = {
  candidate: T;
  eligible: boolean;
  score: number;
  matchPercent: number;
  breakdown: ScoreComponent[];
  reasons: string[];
};

export type RecommendationEngineResult = {
  hotels: Recommendation<HotelCandidate>[];
  activities: Recommendation<ActivityCandidate>[];
};
