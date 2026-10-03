import type { ValidatedTripBrief } from "@/contracts/trip-brief";

type CreatedTrip = {
  tripId: "barcelona";
  redirectUrl: "/trips/barcelona/overview";
  durationDays: number;
  totalTravelers: number;
};

export class UnsupportedDestinationError extends Error {
  constructor() {
    super("Barcelona is the only destination available in the current catalog preview.");
    this.name = "UnsupportedDestinationError";
  }
}

/**
 * Connects a validated brief to the only real trip workspace currently in the repository.
 * Persistence and plan generation are intentionally left to the future planning service.
 */
export function createTrip(brief: ValidatedTripBrief): CreatedTrip {
  const destination = brief.destination.toLocaleLowerCase("en");
  if (destination !== "barcelona" && destination !== "barcelona, spain") {
    throw new UnsupportedDestinationError();
  }

  return {
    tripId: "barcelona",
    redirectUrl: "/trips/barcelona/overview",
    durationDays: brief.durationDays,
    totalTravelers: brief.totalTravelers,
  };
}
