export const SUPPORTED_CURRENCIES = [{ value: "EUR", label: "EUR — Euro" }] as const;

export const TRAVEL_STYLES = [
  { value: "budget", label: "Budget", description: "Prioritise lower-cost options." },
  { value: "balanced", label: "Balanced", description: "Balance comfort and value." },
  { value: "comfort", label: "Comfort", description: "Prioritise convenience and quality." },
  { value: "premium", label: "Luxury", description: "Prioritise premium experiences." },
] as const;

export const HOTEL_CATEGORIES = [
  { value: "any", label: "Any category" },
  { value: "2", label: "Budget · 2 stars" },
  { value: "3", label: "3 stars" },
  { value: "4", label: "4 stars" },
  { value: "5", label: "Luxury · 5 stars" },
] as const;

export const ACTIVITY_INTERESTS = [
  { value: "architecture", label: "Architecture" },
  { value: "museums", label: "Museums" },
  { value: "history", label: "History" },
  { value: "food-markets", label: "Food & markets" },
  { value: "nightlife", label: "Nightlife" },
  { value: "nature", label: "Nature" },
  { value: "beaches", label: "Beaches" },
  { value: "shopping", label: "Shopping" },
  { value: "family", label: "Family" },
  { value: "viewpoints", label: "Viewpoints" },
] as const;

export const TRANSPORT_MODES = [
  { value: "walk", label: "Walking" },
  { value: "public-transit", label: "Public transport" },
  { value: "car", label: "Rental car" },
  { value: "taxi", label: "Taxi" },
] as const;

export const FOOD_CUISINES = [
  { value: "local", label: "Local food" },
  { value: "budget", label: "Budget food" },
  { value: "fine-dining", label: "Fine dining" },
] as const;

export const FOOD_DIETS = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "halal", label: "Halal" },
] as const;

export type TravelStyle = (typeof TRAVEL_STYLES)[number]["value"];
export type HotelCategory = (typeof HOTEL_CATEGORIES)[number]["value"];
export type ActivityInterest = (typeof ACTIVITY_INTERESTS)[number]["value"];
export type TransportMode = (typeof TRANSPORT_MODES)[number]["value"];
export type FoodCuisine = (typeof FOOD_CUISINES)[number]["value"];
export type FoodDiet = (typeof FOOD_DIETS)[number]["value"];
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]["value"];

export type TripBriefInput = {
  departureLocation: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: {
    adults: number;
    children: number;
  };
  budget: {
    amountMinor: number;
    currency: SupportedCurrency;
  };
  travelStyle: TravelStyle;
  hotelPreference: {
    category: HotelCategory;
  };
  selectedActivities: ActivityInterest[];
  transportationPreference: {
    modes: TransportMode[];
  };
  foodPreference: {
    diets: FoodDiet[];
    cuisines: FoodCuisine[];
  };
};

export type TripBriefField =
  | "departureLocation"
  | "destination"
  | "startDate"
  | "endDate"
  | "adults"
  | "children"
  | "budget"
  | "currency"
  | "travelStyle"
  | "hotelPreference"
  | "selectedActivities"
  | "transportationPreference"
  | "foodPreference";

export type TripBriefErrors = Partial<Record<TripBriefField, string>>;

export type ValidatedTripBrief = TripBriefInput & {
  durationDays: number;
  totalTravelers: number;
};

type ValidationResult =
  | { success: true; data: ValidatedTripBrief; errors: TripBriefErrors }
  | { success: false; errors: TripBriefErrors };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isStrictIsoDate(value: string) {
  if (!ISO_DATE.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 0));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === (month ?? 1) - 1 &&
    date.getUTCDate() === day
  );
}

function dateNumber(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 0);
}

function todayNumber() {
  const today = new Date();
  return Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
}

export function calculateTripDurationDays(startDate: string, endDate: string) {
  if (!isStrictIsoDate(startDate) || !isStrictIsoDate(endDate)) return null;
  const durationDays = (dateNumber(endDate) - dateNumber(startDate)) / 86_400_000 + 1;
  return durationDays > 0 ? durationDays : null;
}

function isOneOf<T extends string>(value: string, options: readonly { value: T }[]): value is T {
  return options.some((option) => option.value === value);
}

function readStringArray<T extends string>(
  value: unknown,
  options: readonly { value: T }[],
): T[] | null {
  if (!Array.isArray(value)) return null;
  const values = value.map(readString);
  if (values.some((item) => !isOneOf(item, options))) return null;
  return [...new Set(values as T[])];
}

export function validateTripBrief(value: unknown): ValidationResult {
  const errors: TripBriefErrors = {};
  const root = isRecord(value) ? value : {};
  const travelers = isRecord(root.travelers) ? root.travelers : {};
  const budget = isRecord(root.budget) ? root.budget : {};
  const hotelPreference = isRecord(root.hotelPreference) ? root.hotelPreference : {};
  const transportationPreference = isRecord(root.transportationPreference)
    ? root.transportationPreference
    : {};
  const foodPreference = isRecord(root.foodPreference) ? root.foodPreference : {};

  const departureLocation = readString(root.departureLocation);
  const destination = readString(root.destination);
  const startDate = readString(root.startDate);
  const endDate = readString(root.endDate);
  const adults = travelers.adults;
  const children = travelers.children;
  const amountMinor = budget.amountMinor;
  const currency = readString(budget.currency);
  const travelStyle = readString(root.travelStyle);
  const category = readString(hotelPreference.category);
  const selectedActivities = readStringArray(root.selectedActivities, ACTIVITY_INTERESTS);
  const modes = readStringArray(transportationPreference.modes, TRANSPORT_MODES);
  const diets = readStringArray(foodPreference.diets, FOOD_DIETS);
  const cuisines = readStringArray(foodPreference.cuisines, FOOD_CUISINES);

  if (!departureLocation) errors.departureLocation = "Enter your departure location.";
  else if (departureLocation.length > 120)
    errors.departureLocation = "Departure location must be 120 characters or fewer.";

  if (!destination) errors.destination = "Enter your destination.";
  else if (destination.length > 120)
    errors.destination = "Destination must be 120 characters or fewer.";

  if (!isStrictIsoDate(startDate)) errors.startDate = "Choose a valid start date.";
  else if (dateNumber(startDate) < todayNumber())
    errors.startDate = "Start date cannot be in the past.";

  if (!isStrictIsoDate(endDate)) errors.endDate = "Choose a valid end date.";
  else if (isStrictIsoDate(startDate) && dateNumber(endDate) < dateNumber(startDate))
    errors.endDate = "End date cannot be before the start date.";
  else if (
    isStrictIsoDate(startDate) &&
    (dateNumber(endDate) - dateNumber(startDate)) / 86_400_000 + 1 > 21
  )
    errors.endDate = "Trips can be up to 21 days in this preview.";

  if (!Number.isInteger(adults) || (adults as number) < 1)
    errors.adults = "At least one adult is required.";
  else if ((adults as number) > 10) errors.adults = "You can add up to 10 adults.";

  if (!Number.isInteger(children) || (children as number) < 0)
    errors.children = "Children cannot be a negative number.";
  else if ((children as number) > 9) errors.children = "You can add up to 9 children.";

  if (
    Number.isInteger(adults) &&
    Number.isInteger(children) &&
    (adults as number) + (children as number) > 10
  ) {
    errors.children = "A trip can include up to 10 travelers.";
  }

  if (!Number.isSafeInteger(amountMinor) || (amountMinor as number) <= 0)
    errors.budget = "Budget must be greater than €0.";

  if (!isOneOf(currency, SUPPORTED_CURRENCIES))
    errors.currency = "Choose a supported currency.";
  if (!isOneOf(travelStyle, TRAVEL_STYLES)) errors.travelStyle = "Choose a travel style.";
  if (!isOneOf(category, HOTEL_CATEGORIES))
    errors.hotelPreference = "Choose a valid hotel category.";
  if (!selectedActivities || selectedActivities.length === 0)
    errors.selectedActivities = "Choose at least one activity interest.";
  if (!modes || modes.length === 0)
    errors.transportationPreference = "Choose at least one transportation preference.";
  if (!diets || !cuisines) errors.foodPreference = "Choose valid food preferences.";

  if (Object.keys(errors).length > 0) return { success: false, errors };

  const durationDays = calculateTripDurationDays(startDate, endDate) as number;

  return {
    success: true,
    errors,
    data: {
      departureLocation,
      destination,
      startDate,
      endDate,
      travelers: { adults: adults as number, children: children as number },
      budget: {
        amountMinor: amountMinor as number,
        currency: currency as SupportedCurrency,
      },
      travelStyle: travelStyle as TravelStyle,
      hotelPreference: { category: category as HotelCategory },
      selectedActivities: selectedActivities as ActivityInterest[],
      transportationPreference: { modes: modes as TransportMode[] },
      foodPreference: {
        diets: diets as FoodDiet[],
        cuisines: cuisines as FoodCuisine[],
      },
      durationDays,
      totalTravelers: (adults as number) + (children as number),
    },
  };
}
