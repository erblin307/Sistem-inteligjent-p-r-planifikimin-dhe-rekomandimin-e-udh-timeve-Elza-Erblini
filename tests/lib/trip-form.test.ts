import { describe, expect, it } from "vitest";

import { createTripInput } from "@/contracts/trip";
import {
  fieldForIssuePath,
  initialTripFormState,
  toCreateTripInput,
  toMinorUnits,
  validateTripForm,
  type TripFormState,
} from "@/lib/trip-form";

const DESTINATION = "6f1c2a52-9d0e-4f5e-8a54-3b0a6c0f7d11";
const TODAY = "2026-10-08";

function filled(override: Partial<TripFormState> = {}): TripFormState {
  return {
    ...initialTripFormState(DESTINATION),
    departureCity: "Prishtina",
    startDate: "2027-08-03",
    endDate: "2027-08-05",
    adults: 3,
    budget: "900",
    interests: ["museums"],
    ...override,
  };
}

describe("plan form → trip contract", () => {
  it("maps every form field onto the API payload the trips endpoint accepts", () => {
    const payload = toCreateTripInput(
      filled({
        childAges: [4, 11],
        minHotelStars: "4",
        accommodationType: "apartment",
        pace: "relaxed",
        dietaryRequirements: ["vegetarian"],
        localTransportModes: ["public_transport", "bike"],
      }),
    );
    expect(payload).toEqual({
      destinationId: DESTINATION,
      startDate: "2027-08-03",
      endDate: "2027-08-05",
      departure: { city: "Prishtina" },
      adults: 3,
      childAges: [4, 11],
      budgetMinor: 90_000,
      currency: "EUR",
      travelStyle: "balanced",
      pace: "relaxed",
      minHotelStars: 4,
      accommodationType: "apartment",
      localTransportModes: ["public_transport", "bike"],
      dietaryRequirements: ["vegetarian"],
      interests: ["museums"],
    });
    expect(createTripInput.safeParse(payload).success).toBe(true);
  });

  it("leaves 'any' preferences out instead of sending a placeholder", () => {
    const payload = toCreateTripInput(filled());
    expect(payload).not.toHaveProperty("minHotelStars");
    expect(payload).not.toHaveProperty("accommodationType");
  });

  it("accepts a complete form", () => {
    expect(validateTripForm(filled(), TODAY)).toEqual({});
  });

  it.each([
    ["empty departure", { departureCity: "  " }, "departureCity"],
    ["no destination", { destinationId: "" }, "destinationId"],
    ["no start date", { startDate: "" }, "startDate"],
    ["start in the past", { startDate: "2026-10-07" }, "startDate"],
    ["end before start", { endDate: "2027-08-01" }, "endDate"],
    ["longer than 21 days", { endDate: "2027-09-30" }, "endDate"],
    ["zero adults", { adults: 0 }, "adults"],
    ["more than 10 travelers", { adults: 8, childAges: [5, 6, 7] }, "adults"],
    ["child age missing", { childAges: [Number.NaN] }, "childAges"],
    ["child aged 18", { childAges: [18] }, "childAges"],
    ["zero budget", { budget: "0" }, "budget"],
    ["text budget", { budget: "abc" }, "budget"],
    ["negative budget", { budget: "-5" }, "budget"],
    ["no interests", { interests: [] }, "interests"],
    ["no transport", { localTransportModes: [] }, "localTransportModes"],
  ] as const)("rejects %s", (_, override, field) => {
    const errors = validateTripForm(filled(override as Partial<TripFormState>), TODAY);
    expect(errors[field]).toBeTruthy();
  });

  it("maps API issue paths back to form fields", () => {
    expect(fieldForIssuePath("departure.city")).toBe("departureCity");
    expect(fieldForIssuePath("childAges.0")).toBe("childAges");
    expect(fieldForIssuePath("budgetMinor")).toBe("budget");
    expect(fieldForIssuePath("days")).toBe("endDate");
    expect(fieldForIssuePath("unknown")).toBeUndefined();
  });

  it("parses budgets in major units", () => {
    expect(toMinorUnits("1500")).toBe(150_000);
    expect(toMinorUnits("1500,5")).toBe(150_050);
    expect(toMinorUnits("12.345")).toBeNaN();
    expect(toMinorUnits("")).toBeNaN();
  });
});
