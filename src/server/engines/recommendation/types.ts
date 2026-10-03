export type TravelStyle = "budget" | "balanced" | "comfort" | "premium";
export type HotelType = "hotel" | "apartment" | "hostel" | "guesthouse";
export type TransportationMode = "walk" | "public-transit" | "taxi" | "car";

export type Travelers = {
  adults: number;
  children: number;
};

export type HotelPreference = {
  stars?: 2 | 3 | 4 | 5;
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
  stars: 1 | 2 | 3 | 4 | 5;
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
