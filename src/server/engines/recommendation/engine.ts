import type {
  ActivityCandidate,
  HotelCandidate,
  Recommendation,
  RecommendationEngineInput,
  RecommendationEngineResult,
  RecommendationProfile,
  ScoreComponent,
  ScoreComponentKey,
  TravelStyle,
  TravelTimes,
} from "./types";

type WeightMap = Readonly<Record<ScoreComponentKey, number>>;

const HOTEL_WEIGHTS: WeightMap = Object.freeze({
  budgetMatch: 0.3,
  preferenceMatch: 0.2,
  locationMatch: 0.2,
  activityMatch: 0.15,
  ratingScore: 0.1,
  foodMatch: 0.05,
});

const ACTIVITY_WEIGHTS: WeightMap = Object.freeze({
  budgetMatch: 0.25,
  preferenceMatch: 0.15,
  locationMatch: 0.2,
  activityMatch: 0.25,
  ratingScore: 0.1,
  foodMatch: 0.05,
});

const COMPONENT_LABELS: Record<ScoreComponentKey, string> = {
  budgetMatch: "Budget match",
  preferenceMatch: "Preference match",
  locationMatch: "Location match",
  activityMatch: "Activity match",
  ratingScore: "Rating score",
  foodMatch: "Food preference match",
};

const HOTEL_BUDGET_SHARE: Record<TravelStyle, number> = {
  budget: 0.32,
  balanced: 0.4,
  comfort: 0.48,
  premium: 0.56,
};

const ACTIVITY_BUDGET_SHARE: Record<TravelStyle, number> = {
  budget: 0.12,
  balanced: 0.18,
  comfort: 0.22,
  premium: 0.26,
};

const STYLE_STAR_TARGET: Record<TravelStyle, number> = {
  budget: 2,
  balanced: 3,
  comfort: 4,
  premium: 5,
};

/**
 * Pure and deterministic recommendation engine.
 *
 * The same profile and catalog snapshot always produce the same ordered
 * results. No random values, current time, network access or hidden state are
 * used in scoring.
 */
export function buildRecommendations(input: RecommendationEngineInput): RecommendationEngineResult {
  validateProfile(input.profile);

  return {
    hotels: sortRecommendations(input.hotels.map((hotel) => scoreHotel(input.profile, hotel))),
    activities: sortRecommendations(
      input.activities.map((activity) => scoreActivity(input.profile, activity)),
    ),
  };
}

export function scoreHotel(
  profile: RecommendationProfile,
  hotel: HotelCandidate,
): Recommendation<HotelCandidate> {
  validateHotel(hotel);
  const ineligibility = sharedIneligibility(profile, hotel);
  if (ineligibility) return ineligibleRecommendation(hotel, ineligibility, HOTEL_WEIGHTS);

  const travelers = totalTravelers(profile);
  const nights = Math.max(1, profile.durationDays - 1);
  const rooms = Math.max(1, Math.ceil(travelers / (hotel.maxGuestsPerRoom ?? 2)));
  const nightlyAllowance =
    profile.hotelPreference.maxNightlyPriceMinor ??
    profile.totalBudgetMinor * HOTEL_BUDGET_SHARE[profile.travelStyle] / nights / rooms;
  const totalHotelCost = hotel.nightlyPriceMinor * nights * rooms;
  const totalHotelAllowance = nightlyAllowance * nights * rooms;

  const rawScores: Record<ScoreComponentKey, number> = {
    budgetMatch: budgetMatch(totalHotelCost, totalHotelAllowance),
    preferenceMatch: hotelPreferenceMatch(profile, hotel),
    locationMatch: locationMatch(
      hotel.distanceToCenterMeters,
      hotel.travelMinutesToCenter,
      profile,
    ),
    activityMatch: tagMatch(profile.selectedActivities, hotel.nearbyActivityTags),
    ratingScore: ratingScore(hotel.rating, hotel.reviewCount),
    foodMatch: foodMatch(
      profile,
      hotel.dietaryOptions ?? [],
      hotel.cuisineTags ?? [],
    ),
  };

  const breakdown = createBreakdown(rawScores, HOTEL_WEIGHTS);
  const reasons = hotelReasons(profile, hotel, nightlyAllowance, rawScores);

  return scoredRecommendation(hotel, breakdown, reasons);
}

export function scoreActivity(
  profile: RecommendationProfile,
  activity: ActivityCandidate,
): Recommendation<ActivityCandidate> {
  validateActivity(activity);
  const ineligibility = activityIneligibility(profile, activity);
  if (ineligibility) {
    return ineligibleRecommendation(activity, ineligibility, ACTIVITY_WEIGHTS);
  }

  const travelers = totalTravelers(profile);
  const perPersonDailyAllowance =
    profile.totalBudgetMinor * ACTIVITY_BUDGET_SHARE[profile.travelStyle] /
    profile.durationDays /
    travelers;

  const rawScores: Record<ScoreComponentKey, number> = {
    budgetMatch: budgetMatch(activity.pricePerPersonMinor, perPersonDailyAllowance),
    preferenceMatch: activityPreferenceMatch(profile, activity),
    locationMatch: locationMatch(
      activity.distanceToCenterMeters,
      activity.travelMinutesFromCenter,
      profile,
    ),
    activityMatch: activityTagMatch(profile.selectedActivities, activity),
    ratingScore: ratingScore(activity.rating, activity.reviewCount),
    foodMatch: activity.isFoodExperience
      ? foodMatch(profile, activity.dietaryOptions ?? [], activity.cuisineTags ?? [])
      : 100,
  };

  const breakdown = createBreakdown(rawScores, ACTIVITY_WEIGHTS);
  const reasons = activityReasons(profile, activity, perPersonDailyAllowance, rawScores);

  return scoredRecommendation(activity, breakdown, reasons);
}

function validateProfile(profile: RecommendationProfile) {
  if (!profile.destination.trim()) throw new RangeError("Destination is required.");
  if (!profile.currency.trim()) throw new RangeError("Currency is required.");
  if (!Number.isInteger(profile.totalBudgetMinor) || profile.totalBudgetMinor <= 0) {
    throw new RangeError("Budget must be a positive integer in minor currency units.");
  }
  if (!Number.isInteger(profile.durationDays) || profile.durationDays < 1) {
    throw new RangeError("Trip duration must be at least one day.");
  }
  if (!Number.isInteger(profile.travelers.adults) || profile.travelers.adults < 1) {
    throw new RangeError("At least one adult traveler is required.");
  }
  if (!Number.isInteger(profile.travelers.children) || profile.travelers.children < 0) {
    throw new RangeError("Children must be a non-negative integer.");
  }
  if (profile.transportationPreference.modes.length === 0) {
    throw new RangeError("At least one transportation mode is required.");
  }
}

function validateHotel(hotel: HotelCandidate) {
  validateCandidateBasics(hotel);
  if (!Number.isInteger(hotel.nightlyPriceMinor) || hotel.nightlyPriceMinor < 0) {
    throw new RangeError(`Hotel ${hotel.id} has an invalid nightly price.`);
  }
  if (!Number.isInteger(hotel.stars) || hotel.stars < 1 || hotel.stars > 5) {
    throw new RangeError(`Hotel ${hotel.id} has an invalid star rating.`);
  }
  if (
    hotel.maxGuestsPerRoom !== undefined &&
    (!Number.isInteger(hotel.maxGuestsPerRoom) || hotel.maxGuestsPerRoom < 1)
  ) {
    throw new RangeError(`Hotel ${hotel.id} has an invalid room capacity.`);
  }
}

function validateActivity(activity: ActivityCandidate) {
  validateCandidateBasics(activity);
  if (!Number.isInteger(activity.pricePerPersonMinor) || activity.pricePerPersonMinor < 0) {
    throw new RangeError(`Activity ${activity.id} has an invalid price.`);
  }
  if (!Number.isInteger(activity.durationMinutes) || activity.durationMinutes < 1) {
    throw new RangeError(`Activity ${activity.id} has an invalid duration.`);
  }
  if (
    (activity.minGroupSize !== undefined &&
      (!Number.isInteger(activity.minGroupSize) || activity.minGroupSize < 1)) ||
    (activity.maxGroupSize !== undefined &&
      (!Number.isInteger(activity.maxGroupSize) || activity.maxGroupSize < 1))
  ) {
    throw new RangeError(`Activity ${activity.id} has an invalid group size.`);
  }
  if (
    activity.minGroupSize !== undefined &&
    activity.maxGroupSize !== undefined &&
    activity.minGroupSize > activity.maxGroupSize
  ) {
    throw new RangeError(`Activity ${activity.id} has an invalid group-size range.`);
  }
}

function validateCandidateBasics(candidate: {
  id: string;
  name: string;
  destination: string;
  currency: string;
  rating: number;
  reviewCount: number;
  distanceToCenterMeters: number;
}) {
  if (!candidate.id.trim() || !candidate.name.trim()) {
    throw new RangeError("Every recommendation candidate requires an id and name.");
  }
  if (!candidate.destination.trim() || !candidate.currency.trim()) {
    throw new RangeError(`Candidate ${candidate.id} requires a destination and currency.`);
  }
  if (!Number.isFinite(candidate.rating) || candidate.rating < 0 || candidate.rating > 5) {
    throw new RangeError(`Candidate ${candidate.id} has a rating outside 0–5.`);
  }
  if (!Number.isInteger(candidate.reviewCount) || candidate.reviewCount < 0) {
    throw new RangeError(`Candidate ${candidate.id} has an invalid review count.`);
  }
  if (!Number.isFinite(candidate.distanceToCenterMeters) || candidate.distanceToCenterMeters < 0) {
    throw new RangeError(`Candidate ${candidate.id} has an invalid distance.`);
  }
}

function sharedIneligibility(
  profile: RecommendationProfile,
  candidate: { destination: string; currency: string },
) {
  if (normalise(candidate.destination) !== normalise(profile.destination)) {
    return `Not eligible because it is in ${candidate.destination}, not ${profile.destination}.`;
  }
  if (candidate.currency.toUpperCase() !== profile.currency.toUpperCase()) {
    return `Not eligible because its price is in ${candidate.currency}, not ${profile.currency}.`;
  }
  return null;
}

function activityIneligibility(profile: RecommendationProfile, activity: ActivityCandidate) {
  const shared = sharedIneligibility(profile, activity);
  if (shared) return shared;

  const travelers = totalTravelers(profile);
  if (activity.minGroupSize !== undefined && travelers < activity.minGroupSize) {
    return `Not eligible because it requires at least ${activity.minGroupSize} travelers.`;
  }
  if (activity.maxGroupSize !== undefined && travelers > activity.maxGroupSize) {
    return `Not eligible because it accepts at most ${activity.maxGroupSize} travelers.`;
  }

  if (activity.isFoodExperience && profile.foodPreference.diets.length > 0) {
    const supported = normalisedSet(activity.dietaryOptions ?? []);
    const unsupported = profile.foodPreference.diets.filter((diet) => !supported.has(normalise(diet)));
    if (unsupported.length > 0) {
      return `Not eligible because it does not support: ${unsupported.join(", ")}.`;
    }
  }

  return null;
}

function budgetMatch(cost: number, allowance: number) {
  if (cost <= allowance) return 100;
  if (allowance <= 0) return 0;
  const overBudgetRatio = (cost - allowance) / allowance;
  return clamp(100 - overBudgetRatio * 200);
}

function hotelPreferenceMatch(profile: RecommendationProfile, hotel: HotelCandidate) {
  const requestedStars = profile.hotelPreference.stars;
  const starScore = requestedStars === undefined
    ? 100
    : clamp(100 - Math.abs(hotel.stars - requestedStars) * 35);
  const typeScore = profile.hotelPreference.type === undefined
    ? 100
    : hotel.type === profile.hotelPreference.type ? 100 : 35;
  const styleScore = clamp(100 - Math.abs(hotel.stars - STYLE_STAR_TARGET[profile.travelStyle]) * 20);

  return starScore * 0.5 + typeScore * 0.3 + styleScore * 0.2;
}

function activityPreferenceMatch(profile: RecommendationProfile, activity: ActivityCandidate) {
  const styles = activity.suitableTravelStyles;
  const styleScore = !styles || styles.length === 0 || styles.includes(profile.travelStyle) ? 100 : 45;
  const availableMinutesPerDay = profile.durationDays === 1 ? 360 : 480;
  const durationScore = activity.durationMinutes <= availableMinutesPerDay
    ? 100
    : clamp(100 - (activity.durationMinutes - availableMinutesPerDay) / 3);

  return styleScore * 0.7 + durationScore * 0.3;
}

function locationMatch(
  distanceMeters: number,
  travelMinutes: TravelTimes | undefined,
  profile: RecommendationProfile,
) {
  const preferredModes = profile.transportationPreference.modes;
  const availableTimes = preferredModes
    .map((mode) => travelMinutes?.[mode])
    .filter((minutes): minutes is number => minutes !== undefined && minutes >= 0);

  if (availableTimes.length > 0) {
    const fastestMinutes = Math.min(...availableTimes);
    if (preferredModes.includes("walk") && travelMinutes?.walk !== undefined) {
      const maxWalk = profile.transportationPreference.maxWalkMinutes ?? 30;
      if (travelMinutes.walk <= maxWalk) return 100;
    }
    return linearScore(fastestMinutes, 15, 60);
  }

  return linearScore(distanceMeters, 1_000, 10_000);
}

function activityTagMatch(selectedActivities: string[], activity: ActivityCandidate) {
  const selected = normalisedSet(selectedActivities);
  if (selected.size === 0) return 100;
  if (selected.has(normalise(activity.id)) || selected.has(normalise(activity.name))) return 100;
  return tagMatch(selectedActivities, activity.tags);
}

function tagMatch(requestedTags: string[], candidateTags: string[]) {
  const requested = normalisedSet(requestedTags);
  if (requested.size === 0) return 100;
  const candidate = normalisedSet(candidateTags);
  const matches = [...requested].filter((tag) => candidate.has(tag)).length;
  return matches / requested.size * 100;
}

function foodMatch(profile: RecommendationProfile, diets: string[], cuisines: string[]) {
  const requestedDiets = profile.foodPreference.diets;
  const requestedCuisines = profile.foodPreference.cuisines;
  if (requestedDiets.length === 0 && requestedCuisines.length === 0) return 100;

  const requestedDietSet = normalisedSet(requestedDiets);
  const requestedCuisineSet = normalisedSet(requestedCuisines);
  const supportedDiets = normalisedSet(diets);
  const supportedCuisines = normalisedSet(cuisines);
  const dietScore = requestedDietSet.size === 0
    ? 100
    : [...requestedDietSet].filter((diet) => supportedDiets.has(diet)).length /
      requestedDietSet.size * 100;
  const cuisineScore = requestedCuisineSet.size === 0
    ? 100
    : [...requestedCuisineSet].filter((cuisine) => supportedCuisines.has(cuisine)).length /
      requestedCuisineSet.size * 100;

  return dietScore * 0.7 + cuisineScore * 0.3;
}

function ratingScore(rating: number, reviewCount: number) {
  const normalisedRating = clamp(rating / 5 * 100);
  const confidence = clamp(reviewCount / 1_000, 0, 1);
  return normalisedRating * (0.85 + confidence * 0.15);
}

function createBreakdown(
  rawScores: Record<ScoreComponentKey, number>,
  weights: WeightMap,
): ScoreComponent[] {
  return (Object.keys(weights) as ScoreComponentKey[]).map((key) => {
    const score = round(clamp(rawScores[key]));
    const weight = weights[key];
    return {
      key,
      label: COMPONENT_LABELS[key],
      score,
      weight,
      contribution: round(score * weight),
    };
  });
}

function scoredRecommendation<T>(
  candidate: T,
  breakdown: ScoreComponent[],
  reasons: string[],
): Recommendation<T> {
  const score = Math.round(clamp(breakdown.reduce((total, item) => total + item.contribution, 0)));
  return { candidate, eligible: true, score, matchPercent: score, breakdown, reasons };
}

function ineligibleRecommendation<T>(
  candidate: T,
  reason: string,
  weights: WeightMap,
): Recommendation<T> {
  const zeroScores = Object.fromEntries(
    (Object.keys(weights) as ScoreComponentKey[]).map((key) => [key, 0]),
  ) as Record<ScoreComponentKey, number>;
  return {
    candidate,
    eligible: false,
    score: 0,
    matchPercent: 0,
    breakdown: createBreakdown(zeroScores, weights),
    reasons: [reason],
  };
}

function hotelReasons(
  profile: RecommendationProfile,
  hotel: HotelCandidate,
  nightlyAllowance: number,
  scores: Record<ScoreComponentKey, number>,
) {
  const reasons: string[] = [];
  if (scores.budgetMatch === 100) {
    reasons.push(
      `Within your accommodation budget at ${formatMoney(hotel.nightlyPriceMinor, hotel.currency)} per night.`,
    );
  }
  if (profile.hotelPreference.stars === hotel.stars) {
    reasons.push(`Matches your ${hotel.stars}-star hotel preference.`);
  }
  if (scores.locationMatch >= 80) {
    reasons.push("Well located for your preferred transportation mode.");
  }
  const matchedActivities = matchingTags(profile.selectedActivities, hotel.nearbyActivityTags);
  if (matchedActivities.length > 0) {
    reasons.push(`Near activities that match ${joinWords(matchedActivities)}.`);
  }
  if (scores.ratingScore >= 85) {
    reasons.push(`Highly rated at ${hotel.rating.toFixed(1)}/5 from ${hotel.reviewCount} reviews.`);
  }
  if (reasons.length === 0 && hotel.nightlyPriceMinor > nightlyAllowance) {
    reasons.push(
      `${formatMoney(hotel.nightlyPriceMinor - nightlyAllowance, hotel.currency)} per night above your accommodation allowance.`,
    );
  }
  return reasons.slice(0, 3);
}

function activityReasons(
  profile: RecommendationProfile,
  activity: ActivityCandidate,
  allowance: number,
  scores: Record<ScoreComponentKey, number>,
) {
  const reasons: string[] = [];
  const matchedActivities = matchingTags(profile.selectedActivities, [activity.id, activity.name, ...activity.tags]);
  if (matchedActivities.length > 0) {
    reasons.push(`Matches your interest in ${joinWords(matchedActivities)}.`);
  }
  if (scores.budgetMatch === 100) {
    reasons.push(
      activity.pricePerPersonMinor === 0
        ? "Free to visit and fits your activity budget."
        : `Within your daily activity budget at ${formatMoney(activity.pricePerPersonMinor, activity.currency)} per person.`,
    );
  }
  if (scores.locationMatch >= 80) {
    reasons.push("Easy to reach using your preferred transportation mode.");
  }
  if (scores.ratingScore >= 85) {
    reasons.push(`Highly rated at ${activity.rating.toFixed(1)}/5 from ${activity.reviewCount} reviews.`);
  }
  if (activity.isFoodExperience && scores.foodMatch >= 80) {
    reasons.push("Matches your food preferences.");
  }
  if (reasons.length === 0 && activity.pricePerPersonMinor > allowance) {
    reasons.push(
      `${formatMoney(activity.pricePerPersonMinor - allowance, activity.currency)} per person above the daily activity allowance.`,
    );
  }
  return reasons.slice(0, 3);
}

function matchingTags(requestedTags: string[], candidateTags: string[]) {
  const candidate = normalisedSet(candidateTags);
  return [...new Set(requestedTags.filter((tag) => candidate.has(normalise(tag))))];
}

function sortRecommendations<T>(recommendations: Recommendation<T>[]) {
  return recommendations.sort((left, right) => {
    if (left.eligible !== right.eligible) return left.eligible ? -1 : 1;
    if (right.score !== left.score) return right.score - left.score;
    return candidateId(left.candidate).localeCompare(candidateId(right.candidate));
  });
}

function candidateId(candidate: unknown) {
  if (typeof candidate === "object" && candidate !== null && "id" in candidate) {
    return String(candidate.id);
  }
  return "";
}

function totalTravelers(profile: RecommendationProfile) {
  return profile.travelers.adults + profile.travelers.children;
}

function normalisedSet(values: string[]) {
  return new Set(values.map(normalise));
}

function normalise(value: string) {
  return value.trim().toLocaleLowerCase("en-US");
}

function linearScore(value: number, fullScoreAt: number, zeroScoreAt: number) {
  if (value <= fullScoreAt) return 100;
  if (value >= zeroScoreAt) return 0;
  return (zeroScoreAt - value) / (zeroScoreAt - fullScoreAt) * 100;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function formatMoney(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: amountMinor % 100 === 0 ? 0 : 2,
  }).format(amountMinor / 100);
}

function joinWords(values: string[]) {
  if (values.length <= 1) return values[0] ?? "your selected activities";
  return `${values.slice(0, -1).join(", ")} and ${values.at(-1)}`;
}

export const recommendationWeights = Object.freeze({
  hotels: HOTEL_WEIGHTS,
  activities: ACTIVITY_WEIGHTS,
});
