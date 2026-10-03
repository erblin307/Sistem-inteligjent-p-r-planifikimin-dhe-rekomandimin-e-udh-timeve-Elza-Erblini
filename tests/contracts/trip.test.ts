import { describe, expect, it } from "vitest";

import { addDays, createTripInput, dayCount } from "@/contracts/trip";

const valid = {
  destinationId: "6f1c2a52-9d0e-4f5e-8a54-3b0a6c0f7d11",
  startDate: "2027-07-12",
  endDate: "2027-07-17",
  adults: 2,
  budgetMinor: 150_000,
  currency: "EUR",
  travelStyle: "balanced",
  localTransportModes: ["walk"],
  interests: ["architecture"],
};

function issues(input: unknown) {
  const result = createTripInput.safeParse(input);
  if (result.success) return [];
  return result.error.issues.map((i) => i.path.join("."));
}

describe("createTripInput", () => {
  it("accepts a complete brief and applies defaults", () => {
    const parsed = createTripInput.parse(valid);
    expect(parsed).toMatchObject({
      endDate: "2027-07-17",
      childAges: [],
      pace: "moderate",
      budgetIncludesTransport: true,
      dietaryRequirements: [],
    });
  });

  it("derives the end date from a number of days", () => {
    const rest = { ...valid, endDate: undefined };
    expect(createTripInput.parse({ ...rest, days: 6 }).endDate).toBe("2027-07-17");
    expect(createTripInput.parse({ ...rest, days: 1 }).endDate).toBe("2027-07-12");
  });

  it("removes duplicate interests", () => {
    expect(createTripInput.parse({ ...valid, interests: ["food", "food"] }).interests).toEqual(["food"]);
  });

  it.each([
    ["negative budget", { budgetMinor: -500 }, "budgetMinor"],
    ["zero budget", { budgetMinor: 0 }, "budgetMinor"],
    ["fractional budget", { budgetMinor: 1500.5 }, "budgetMinor"],
    ["zero adults", { adults: 0 }, "adults"],
    ["child aged 18", { childAges: [18] }, "childAges.0"],
    ["too many travelers", { adults: 8, childAges: [3, 5, 9] }, "adults"],
    ["zero days", { endDate: undefined, days: 0 }, "days"],
    ["end before start", { endDate: "2027-07-10" }, "endDate"],
    ["trip too long", { endDate: "2027-08-30" }, "endDate"],
    ["impossible date", { startDate: "2027-02-30" }, "startDate"],
    ["badly formatted date", { startDate: "12/07/2027" }, "startDate"],
    ["days disagree with dates", { days: 3 }, "days"],
    ["unsupported travel style", { travelStyle: "luxury" }, "travelStyle"],
    ["unsupported transport mode", { localTransportModes: ["helicopter"] }, "localTransportModes.0"],
    ["no transport mode", { localTransportModes: [] }, "localTransportModes"],
    ["unsupported diet", { dietaryRequirements: ["paleo"] }, "dietaryRequirements.0"],
    ["hotel stars 6", { minHotelStars: 6 }, "minHotelStars"],
    ["no interests", { interests: [] }, "interests"],
    ["lowercase currency", { currency: "eur" }, "currency"],
    ["destination is not an id", { destinationId: "barcelona" }, "destinationId"],
  ])("rejects %s", (_label, override, path) => {
    expect(issues({ ...valid, ...override })).toContain(path);
  });

  it.each(["destinationId", "startDate", "adults", "budgetMinor", "currency", "travelStyle", "localTransportModes", "interests"])(
    "requires %s",
    (field) => {
      const input: Record<string, unknown> = { ...valid };
      delete input[field];
      expect(issues(input)).toContain(field);
    },
  );

  it("requires either an end date or a number of days", () => {
    expect(issues({ ...valid, endDate: undefined })).toContain("endDate");
  });
});

describe("date helpers", () => {
  it("counts days inclusively and adds days across month ends", () => {
    expect(dayCount("2027-07-12", "2027-07-17")).toBe(6);
    expect(addDays("2027-01-30", 3)).toBe("2027-02-02");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
  });
});
