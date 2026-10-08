import * as React from "react";

import type { TripResponse } from "@/contracts/trip";
import { formatMoney, plural } from "@/lib/format";
import {
  ACCOMMODATION_TYPE_OPTIONS,
  DIET_OPTIONS,
  PACE_OPTIONS,
  TRANSPORT_OPTIONS,
  TRAVEL_STYLE_OPTIONS,
} from "@/lib/trip-form";

function label<T extends string>(options: readonly { value: T; label: string }[], value: T) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}

/** The saved brief as a definition list: every value comes from the trip record. */
function TripBrief({ trip }: { trip: TripResponse }) {
  const { preferences: p } = trip;
  const rows: [string, React.ReactNode][] = [
    ["Route", trip.departure ? `${trip.departure.city} → ${trip.destination.name}` : trip.destination.name],
    [
      "Dates",
      `${formatDate(trip.startDate)} – ${formatDate(trip.endDate)} · ${plural(trip.days, "day")}, ${plural(trip.nights, "night")}`,
    ],
    [
      "Travelers",
      [
        plural(trip.travelers.adults, "adult"),
        trip.travelers.childAges.length
          ? `${plural(trip.travelers.childAges.length, "child", "children")} (aged ${trip.travelers.childAges.join(", ")})`
          : null,
      ]
        .filter(Boolean)
        .join(" · "),
    ],
    [
      "Budget",
      <span key="b" className="tabular">
        {formatMoney(trip.budget)} total · {label(TRAVEL_STYLE_OPTIONS, p.travelStyle)}
      </span>,
    ],
    [
      "Accommodation",
      [
        p.minHotelStars ? `${p.minHotelStars} stars or more` : "Any category",
        p.accommodationType ? label(ACCOMMODATION_TYPE_OPTIONS, p.accommodationType) : "Any type",
      ].join(" · "),
    ],
    ["Interests", p.interests.map((i) => i.name).join(", ")],
    ["Pace", label(PACE_OPTIONS, p.pace)],
    ["Getting around", p.localTransportModes.map((m) => label(TRANSPORT_OPTIONS, m)).join(", ")],
    [
      "Dietary requirements",
      p.dietaryRequirements.length
        ? p.dietaryRequirements.map((d) => label(DIET_OPTIONS, d)).join(", ")
        : "None",
    ],
  ];

  return (
    <dl className="divide-y border-y">
      {rows.map(([term, value]) => (
        <div key={term} className="grid gap-1 py-4 md:grid-cols-[200px_minmax(0,1fr)] md:gap-4">
          <dt className="type-caption text-muted-foreground">{term}</dt>
          <dd className="type-body text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export { TripBrief };
