/**
 * Sample data for the design system and component previews.
 * Shapes mirror the plan API contracts in docs/ARCHITECTURE.md §7.
 */
import { eur, type Money } from "@/lib/format";

export type TripSummary = {
  destination: string;
  country: string;
  startDate: Date;
  endDate: Date;
  adults: number;
  children: number;
  budget: Money;
  status: "draft" | "planned" | "archived";
};

export type ItineraryItem = {
  id: string;
  kind: "activity" | "meal" | "free";
  start: string; // local "HH:mm"
  durationMin: number;
  title: string;
  location: string;
  cost: Money | null; // null = free / included
  marker?: number; // matches the map marker for this day
  booking?: "required" | "booked";
  legBefore?: { mode: "walk" | "transit" | "taxi"; minutes: number; meters: number };
};

export type Hotel = {
  id: string;
  name: string;
  stars: 1 | 2 | 3 | 4 | 5;
  rating: number; // 0–5
  reviewCount: number;
  area: string;
  distanceToCentreM: number;
  amenities: string[];
  pricePerNight: Money;
  nights: number;
  rooms: number;
  freeCancellation: boolean;
  score: number; // recommendation score 0–100
  reasons: string[];
};

export type Activity = {
  id: string;
  title: string;
  category: string;
  rating: number;
  reviewCount: number;
  durationMin: number;
  price: Money | null;
  distanceM: number;
  score: number;
  reason?: string;
};

export type BudgetLine = {
  category:
    | "Accommodation"
    | "Transport"
    | "Food"
    | "Activities"
    | "Local transport"
    | "Reserve";
  planned: Money;
  basis: string;
};

export const trip: TripSummary = {
  destination: "Barcelona",
  country: "Spain",
  startDate: new Date(Date.UTC(2027, 6, 12)),
  endDate: new Date(Date.UTC(2027, 6, 17)),
  adults: 2,
  children: 0,
  budget: eur(1500),
  status: "planned",
};

export const dayTwo: ItineraryItem[] = [
  {
    id: "i1",
    kind: "meal",
    start: "09:00",
    durationMin: 45,
    title: "Breakfast",
    location: "Café Cosmo, Eixample",
    cost: eur(18),
  },
  {
    id: "i2",
    kind: "activity",
    start: "10:30",
    durationMin: 90,
    title: "Sagrada Família",
    location: "Carrer de Mallorca 401",
    cost: eur(68),
    marker: 1,
    booking: "booked",
    legBefore: { mode: "walk", minutes: 14, meters: 1100 },
  },
  {
    id: "i3",
    kind: "meal",
    start: "13:00",
    durationMin: 75,
    title: "Lunch",
    location: "La Paradeta, Sagrada Família",
    cost: eur(46),
    legBefore: { mode: "walk", minutes: 6, meters: 450 },
  },
  {
    id: "i4",
    kind: "activity",
    start: "15:00",
    durationMin: 120,
    title: "Park Güell",
    location: "Carrer d'Olot, Gràcia",
    cost: eur(36),
    marker: 2,
    booking: "required",
    legBefore: { mode: "transit", minutes: 22, meters: 3200 },
  },
  {
    id: "i5",
    kind: "activity",
    start: "17:45",
    durationMin: 60,
    title: "Bunkers del Carmel",
    location: "Turó de la Rovira",
    cost: null,
    marker: 3,
    legBefore: { mode: "walk", minutes: 25, meters: 1800 },
  },
  {
    id: "i6",
    kind: "meal",
    start: "20:30",
    durationMin: 90,
    title: "Dinner",
    location: "Bar Canete, El Raval",
    cost: eur(84),
    legBefore: { mode: "taxi", minutes: 18, meters: 5600 },
  },
];

export const hotels: Hotel[] = [
  {
    id: "h1",
    name: "Hotel Casa Fuster",
    stars: 4,
    rating: 4.6,
    reviewCount: 2341,
    area: "Gràcia",
    distanceToCentreM: 2100,
    amenities: ["Breakfast included", "Air conditioning", "Rooftop terrace"],
    pricePerNight: eur(142),
    nights: 5,
    rooms: 1,
    freeCancellation: true,
    score: 92,
    reasons: ["Within your nightly budget", "12 min to 4 of your activities"],
  },
  {
    id: "h2",
    name: "Praktik Bakery",
    stars: 3,
    rating: 4.4,
    reviewCount: 1876,
    area: "Eixample",
    distanceToCentreM: 900,
    amenities: ["Free Wi-Fi", "Air conditioning", "24-hour reception"],
    pricePerNight: eur(118),
    nights: 5,
    rooms: 1,
    freeCancellation: false,
    score: 86,
    reasons: ["€120 under your accommodation budget"],
  },
];

export const activities: Activity[] = [
  {
    id: "a1",
    title: "Casa Batlló",
    category: "Architecture",
    rating: 4.7,
    reviewCount: 98213,
    durationMin: 75,
    price: eur(35),
    distanceM: 1300,
    score: 94,
    reason: "Matches architecture",
  },
  {
    id: "a2",
    title: "Picasso Museum",
    category: "Museums",
    rating: 4.5,
    reviewCount: 41560,
    durationMin: 120,
    price: eur(15),
    distanceM: 2600,
    score: 88,
    reason: "Matches museums",
  },
  {
    id: "a3",
    title: "La Boqueria Market",
    category: "Food & markets",
    rating: 4.4,
    reviewCount: 120344,
    durationMin: 60,
    price: null,
    distanceM: 1900,
    score: 81,
  },
];

export const budgetLines: BudgetLine[] = [
  { category: "Accommodation", planned: eur(710), basis: "5 nights × €142, 1 room" },
  { category: "Transport", planned: eur(150), basis: "Return flights from Prishtina, estimate" },
  { category: "Food", planned: eur(240), basis: "€24 per person per day" },
  { category: "Activities", planned: eur(124), basis: "5 paid activities, 2 people" },
  { category: "Local transport", planned: eur(60), basis: "T-casual cards + 2 taxis" },
  { category: "Reserve", planned: eur(150), basis: "10% of total budget" },
];
