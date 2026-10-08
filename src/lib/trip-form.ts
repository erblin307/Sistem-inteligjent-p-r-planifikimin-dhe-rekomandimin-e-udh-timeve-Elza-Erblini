import {
  createTripInput,
  MAX_PARTY_SIZE,
  type accommodationTypes,
  type CreateTripInput,
  type dietaryRequirements,
  type localTransportModes,
  type travelPaces,
  type travelStyles,
} from "@/contracts/trip";

/**
 * The plan form's state and its mapping onto the one trip contract
 * (src/contracts/trip.ts → POST /api/v1/trips). The form keeps text inputs
 * as strings; this module turns them into the API payload and maps contract
 * issues back onto form fields.
 */

type TravelStyle = (typeof travelStyles)[number];
type TravelPace = (typeof travelPaces)[number];
type AccommodationType = (typeof accommodationTypes)[number];
type LocalTransportMode = (typeof localTransportModes)[number];
type DietaryRequirement = (typeof dietaryRequirements)[number];

export const SUPPORTED_CURRENCIES = [{ value: "EUR", label: "EUR — Euro" }] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]["value"];

export const TRAVEL_STYLE_OPTIONS: { value: TravelStyle; label: string; description: string }[] = [
  { value: "budget", label: "Budget", description: "Prioritise lower-cost options." },
  { value: "balanced", label: "Balanced", description: "Balance comfort and value." },
  { value: "comfort", label: "Comfort", description: "Prioritise convenience and quality." },
  { value: "premium", label: "Luxury", description: "Prioritise premium experiences." },
];

export const PACE_OPTIONS: { value: TravelPace; label: string; description: string }[] = [
  { value: "relaxed", label: "Relaxed", description: "Fewer stops and longer breaks." },
  { value: "moderate", label: "Moderate", description: "A comfortable mix of plans and free time." },
  { value: "packed", label: "Packed", description: "See as much as possible each day." },
];

export const HOTEL_STAR_OPTIONS = [
  { value: "any", label: "Any category" },
  { value: "2", label: "2 stars or more" },
  { value: "3", label: "3 stars or more" },
  { value: "4", label: "4 stars or more" },
  { value: "5", label: "5 stars" },
] as const;
export type HotelStarOption = (typeof HOTEL_STAR_OPTIONS)[number]["value"];

export const ACCOMMODATION_TYPE_OPTIONS: { value: AccommodationType | "any"; label: string }[] = [
  { value: "any", label: "Any type" },
  { value: "hotel", label: "Hotel" },
  { value: "apartment", label: "Apartment" },
  { value: "guesthouse", label: "Guesthouse" },
  { value: "hostel", label: "Hostel" },
];

export const TRANSPORT_OPTIONS: { value: LocalTransportMode; label: string }[] = [
  { value: "walk", label: "Walking" },
  { value: "public_transport", label: "Public transport" },
  { value: "taxi", label: "Taxi" },
  { value: "car", label: "Rental car" },
  { value: "bike", label: "Bike" },
];

export const DIET_OPTIONS: { value: DietaryRequirement; label: string }[] = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "halal", label: "Halal" },
  { value: "kosher", label: "Kosher" },
  { value: "gluten_free", label: "Gluten-free" },
];

export type TripFormState = {
  departureCity: string;
  destinationId: string;
  startDate: string;
  endDate: string;
  adults: number;
  childAges: number[];
  budget: string;
  currency: SupportedCurrency;
  travelStyle: TravelStyle;
  pace: TravelPace;
  minHotelStars: HotelStarOption;
  accommodationType: AccommodationType | "any";
  interests: string[];
  localTransportModes: LocalTransportMode[];
  dietaryRequirements: DietaryRequirement[];
};

export type TripFormField =
  | "departureCity"
  | "destinationId"
  | "startDate"
  | "endDate"
  | "adults"
  | "childAges"
  | "budget"
  | "currency"
  | "travelStyle"
  | "pace"
  | "minHotelStars"
  | "accommodationType"
  | "interests"
  | "localTransportModes"
  | "dietaryRequirements";

export type TripFormErrors = Partial<Record<TripFormField, string>>;

export function initialTripFormState(destinationId = ""): TripFormState {
  return {
    departureCity: "",
    destinationId,
    startDate: "",
    endDate: "",
    adults: 1,
    childAges: [],
    budget: "",
    currency: "EUR",
    travelStyle: "balanced",
    pace: "moderate",
    minHotelStars: "any",
    accommodationType: "any",
    interests: [],
    localTransportModes: ["walk", "public_transport"],
    dietaryRequirements: [],
  };
}

/** "1500", "1500.5", "1500,50" → minor units; anything else → NaN. */
export function toMinorUnits(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(?:\.\d{0,2})?$/.test(normalized)) return Number.NaN;
  const [whole = "0", fraction = ""] = normalized.split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(amount) ? amount : Number.NaN;
}

export function toCreateTripInput(state: TripFormState): CreateTripInput {
  const departureCity = state.departureCity.trim();
  return {
    destinationId: state.destinationId,
    startDate: state.startDate,
    endDate: state.endDate,
    ...(departureCity ? { departure: { city: departureCity } } : {}),
    adults: state.adults,
    childAges: state.childAges,
    budgetMinor: toMinorUnits(state.budget),
    currency: state.currency,
    travelStyle: state.travelStyle,
    pace: state.pace,
    ...(state.minHotelStars === "any" ? {} : { minHotelStars: Number(state.minHotelStars) }),
    ...(state.accommodationType === "any" ? {} : { accommodationType: state.accommodationType }),
    localTransportModes: state.localTransportModes,
    dietaryRequirements: state.dietaryRequirements,
    interests: state.interests,
  };
}

/** Contract issue path ("departure.city", "childAges.0", "days") → form field. */
export function fieldForIssuePath(path: string): TripFormField | undefined {
  const head = path.split(".")[0] ?? "";
  const map: Record<string, TripFormField> = {
    departure: "departureCity",
    destinationId: "destinationId",
    startDate: "startDate",
    endDate: "endDate",
    days: "endDate",
    adults: "adults",
    childAges: "childAges",
    budgetMinor: "budget",
    currency: "currency",
    travelStyle: "travelStyle",
    pace: "pace",
    minHotelStars: "minHotelStars",
    accommodationType: "accommodationType",
    interests: "interests",
    localTransportModes: "localTransportModes",
    dietaryRequirements: "dietaryRequirements",
  };
  return map[head];
}

/** Today's calendar date in the browser's time zone, "YYYY-MM-DD". */
export function localToday(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Validates the whole form with the API contract plus the form's own rules
 * (departure is required here, friendlier budget and date messages). The
 * server re-validates; the start date is checked again against the
 * destination's time zone there.
 */
export function validateTripForm(state: TripFormState, today = localToday()): TripFormErrors {
  const errors: TripFormErrors = {};
  const result = createTripInput.safeParse(toCreateTripInput(state));
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = fieldForIssuePath(issue.path.map(String).join("."));
      if (field && !errors[field]) errors[field] = issue.message;
    }
  }

  if (!state.departureCity.trim()) errors.departureCity = "Enter your departure city.";
  if (!state.destinationId) errors.destinationId = "Choose a destination.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(state.startDate)) errors.startDate = "Choose a start date.";
  else if (state.startDate < today) errors.startDate = "Start date cannot be in the past.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(state.endDate)) errors.endDate = "Choose an end date.";
  if (!Number.isInteger(state.adults) || state.adults < 1) {
    errors.adults = "At least one adult is required.";
  }
  if (state.childAges.some((age) => !Number.isInteger(age) || age < 0 || age > 17)) {
    errors.childAges = "Enter each child's age from 0 to 17.";
  }
  if (state.adults + state.childAges.length > MAX_PARTY_SIZE) {
    errors.adults = `Plan for at most ${MAX_PARTY_SIZE} travelers.`;
  }
  const budgetMinor = toMinorUnits(state.budget);
  if (!Number.isSafeInteger(budgetMinor) || budgetMinor <= 0) {
    errors.budget = "Enter a budget greater than 0, e.g. 1500.";
  }
  if (state.interests.length === 0) errors.interests = "Choose at least one interest.";
  if (state.localTransportModes.length === 0) {
    errors.localTransportModes = "Choose at least one way to get around.";
  }
  return errors;
}
