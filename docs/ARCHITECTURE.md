# Intelligent Travel Planning and Recommendation System — Technical Architecture

| | |
|---|---|
| Status | Draft v1 for review |
| Scope | MVP plus the extension points it has to leave open |
| Stack | Next.js (App Router), TypeScript (strict), PostgreSQL, Drizzle ORM, Zod, TanStack Query, Tailwind CSS, shadcn/ui |
| Date | 2026-10-03 |

---

## 0. Summary

The system takes a structured trip brief (origin, destination, dates, party, budget, preferences). It returns a complete plan you can edit: a recommended hotel, ranked activities, a day-by-day itinerary with route order, a budget split and map data. Every score comes with an explanation.

The main architectural decisions:

1. **A modular monolith in one Next.js app.** Domain logic lives in framework-free TypeScript modules under `src/server`. Next.js is only the delivery layer.
2. **Three pure, deterministic engines:** Recommendation, Itinerary and Budget. Each engine is a function `(input, catalog snapshot, config) → output`. The engines do no I/O. That makes them easy to test, easy to version and possible to replay.
3. **Plans are versioned snapshots.** A trip owns many `trip_plans`. Regenerating creates a new version instead of mutating the old one. User edits ("locks") carry over into the next version.
4. **External data sits behind ports and adapters.** For the MVP, a curated catalog is the source of truth. Live providers fill in or refresh it through adapters, and their responses are cached.
5. **One API surface.** Versioned REST Route Handlers (`/api/v1`) are used by TanStack Query. Server Components read through the same service layer directly, with no HTTP hop. Domain mutations do not use Server Actions, so there is only one write path to secure and test.
6. **Money is stored as integer minor units plus a currency code. Estimates carry a range.** The UI never presents an estimate as a quote.

---

## 1. Functional requirements analysis

### 1.1 Inputs (trip brief)

| Input | Type | Notes / derived rules |
|---|---|---|
| Departure location | Geocoded place (city or airport) | Used only to estimate transport to the destination. Not used for routing inside the destination. |
| Destination | Geocoded city | The MVP plans a single city. The destination must exist in the catalog (see §2). |
| Travel dates | `startDate`, `endDate` (ISO dates, destination time zone) | |
| Number of days | **Derived**, not entered | `days = endDate − startDate + 1`, `nights = days − 1`. Storing both values invites contradictions, so the form asks for dates only and shows the derived count. |
| Travelers | Adults (≥1), children (≥0) | **Gap:** child ages are needed for pricing (free under 4, child rates), activity suitability and room occupancy. The form collects an age for each child. |
| Total budget | Amount plus currency | Includes or excludes transport to the destination (a toggle; the default is *included*). |
| Hotel category | 2★–5★ or "any", optional type (hotel / apartment) | Treated as a hard filter with a ±1 star tolerance flag. |
| Travel style | `budget` · `balanced` · `comfort` · `premium`, plus pace `relaxed` · `moderate` · `packed` | Two independent dimensions. Style drives spend levels. Pace drives daily capacity. |
| Activity interests | Multi-select from a controlled taxonomy | For example: architecture, museums, history, food & markets, nightlife, nature, beaches, shopping, family, sports, viewpoints. |
| Food preferences | Diet flags (vegetarian, vegan, halal, kosher, gluten-free) plus cuisine/experience tags (local, street food, fine dining) | Diet flags are **hard** constraints. Cuisine tags are soft. |
| Transportation preferences | Local modes (walk, public transit, taxi/ride-hail, car) and maximum walking time per leg; inbound mode (flight, train, car, any) | Determines the routing profile and the local-transport budget. |

### 1.2 Outputs

| Output | Produced by | Persisted in |
|---|---|---|
| Personalised travel plan (the aggregate) | Plan orchestrator | `trip_plans` |
| Hotel recommendations (ranked, with score breakdown) | Recommendation engine | `recommendation_results` |
| Activity recommendations (ranked, with reasons) | Recommendation engine | `recommendation_results` |
| Budget allocation (category lines, low/expected/high) | Budget engine | `budget_lines` |
| Day-by-day itinerary | Itinerary engine | `itinerary_days`, `itinerary_items` |
| Route optimisation (order of stops and legs) | Itinerary engine (routing port) | `itinerary_legs` |
| Map locations | All engines (coordinates on places) | `places` (joined) |
| Estimated costs | Budget engine, attached per item | `itinerary_items.cost_*`, `budget_lines` |
| Recommendation scores (0–100 plus components) | Recommendation engine | `recommendation_results.breakdown` |
| Saved trips and saved places | Trips and Saved modules | `trips`, `saved_items` |

### 1.3 Implicit requirements surfaced during analysis

- **Feasibility feedback.** A brief can be infeasible: €300 for four people over seven nights at 4★. The system must say so and suggest changes. It must not silently produce a broken plan.
- **Editability.** Users will reorder, remove, lock and add items. Regeneration must respect locked items.
- **Explainability.** Each recommendation shows *why*, for example "Matches *architecture* · 12 min from your hotel · within budget".
- **Time realism.** Opening hours, travel time between stops, meal windows, and shorter arrival and departure days.
- **Time zones and currency.** All itinerary times are local to the destination. Budgets are shown in the user's currency, and conversions are snapshotted.
- **Reproducibility.** The same brief, catalog snapshot and engine version must give the same plan. This is needed for support, debugging and tests.

### 1.4 Explicit non-goals (MVP)

Booking and payment. Live availability guarantees. Multi-city trips. Flight search. Collaborative editing. Native mobile apps. Destination discovery ("where should I go?"). All of these are left open as extension points in §2.3.

---

## 2. MVP definition

### 2.1 MVP goal

A signed-in user completes the five-step brief for one of the **launch destinations**. Within 10 s (p95) they receive a coherent, editable plan with a hotel, activities, itinerary, map and budget. They can save the plan and return to it.

### 2.2 In scope

| Area | MVP capability |
|---|---|
| Destinations | 6–10 curated launch cities (e.g. Barcelona, Lisbon, Rome, Paris, Amsterdam, Prague), each with roughly 40–80 hotels, 80–150 activities and 60–120 restaurants in the catalog |
| Brief | Five-step form (destination and dates → travelers and budget → accommodation → interests, food and transport → review) with drafts autosaved |
| Generation | Synchronous generation with an async-shaped API contract (see §7.4), idempotent |
| Recommendations | Ranked hotels and activities with a 0–100 score and reasons. Filter and sort. Swap hotel. |
| Itinerary | Day timeline with time, activity, location, duration and cost. Reorder, remove, lock, add from recommendations, re-optimise one day. |
| Map | All plan places, per-day route lines, hotel anchor. Selection is synced with the list. |
| Budget | Total / planned / remaining, six category lines, infeasibility warnings and suggestions |
| Account | Email magic link and Google sign-in, profile defaults (currency, home city, diet, pace) |
| Saved | Save or unsave trips and individual places |

### 2.3 Out of scope, with extension points left open

| Later capability | Extension point that exists in the MVP |
|---|---|
| Live hotel / activity inventory and booking | `HotelProvider` / `ActivityProvider` ports, `places.external_refs` |
| Multi-city routes | `trip_plans` → `itinerary_days.base_place_id` (one hotel per day range) |
| Learning-to-rank from behaviour | `interaction_events` table, `scoring_config` versioning |
| Collaboration / sharing | `trip_members` table (MVP: only the owner) |
| Background workers | `generation_jobs` table, `PlanGenerator` interface |
| Flights | `TransportEstimator` port (the MVP uses a distance-based estimate) |

### 2.4 Release phases

1. **M0 – Foundations:** repo, CI, auth, database, design system, catalog seeding pipeline.
2. **M1 – Brief and engines:** form, three engines with unit and property tests, orchestrator.
3. **M2 – Workspace:** trip workspace tabs, itinerary editing, map, budget.
4. **M3 – Hardening:** live adapters (geocoding, routing, weather, FX), rate limits, observability, E2E, accessibility audit.

---

## 3. Application modules

Bounded modules inside the monolith. A module exposes a `service` (use cases) and `types`. Other modules never import a module's repository directly.

| Module | Responsibility | Depends on |
|---|---|---|
| `identity` | Users, sessions, profile and preference defaults | — |
| `catalog` | Destinations, places (hotels, activities, restaurants), tags, opening hours, price data, seeding and ingestion | `integrations` |
| `trips` | Trip CRUD, brief drafts, ownership, saved trips | `identity` |
| `planning` | Orchestrator: brief → catalog snapshot → engines → persisted plan version. Generation jobs. | `catalog`, `recommendation`, `itinerary`, `budget`, `trips` |
| `recommendation` | Pure scoring and ranking engine | — (pure) |
| `itinerary` | Pure day clustering, sequencing and scheduling engine. Uses the routing port. | `routing` port |
| `budget` | Pure allocation, estimation and feasibility engine | — (pure) |
| `routing` | Travel-time matrices and route geometry (port plus adapters, with a haversine fallback) | `integrations` |
| `saved` | Saved places and trips | `identity`, `catalog` |
| `integrations` | Provider adapters, HTTP client, caching, circuit breakers | — |
| `platform` | Config/env, logging, errors, rate limiting, auditing, clock, ids | — |

The dependency rule is enforced with `eslint-plugin-boundaries` (or `dependency-cruiser`). Engines may import only `platform/types` and their own code.

---

## 4. Frontend architecture

### 4.1 Rendering model

- **App Router with React Server Components** for page shells and the first data load. Server Components call module services directly through `src/server/*`, protected by `server-only`.
- **TanStack Query** for all client-side reads and mutations after the first render. Server Components *prefetch* into a per-request `QueryClient` and pass it through `HydrationBoundary`. This avoids double fetching and loading spinners on navigation.
- **Client Components** only where needed: forms, map, drag-to-reorder, tabs with local interaction.

### 4.2 Route map

```
/                         → redirect to /overview (signed in) or /sign-in
/sign-in
/overview                 → upcoming trip, drafts, recent saved
/plan                     → multi-step brief (?step=1..5&draft=<id>)
/trips                    → My Trips (upcoming, past, drafts)
/trips/[tripId]           → workspace layout (header + tabs)
    /overview  (default)
    /itinerary
    /map
    /hotels
    /activities
    /budget
/saved                    → saved places and trips
/profile                  → account, defaults, data export/delete
```

The workspace **tabs are nested routes**, not client-side tab state. Each tab can be deep-linked and bookmarked, Back works, and each tab streams its own data. `trips/[tripId]/layout.tsx` fetches the trip header once (destination, dates, travelers, budget) and renders the tab bar.

### 4.3 State ownership

| State | Owner |
|---|---|
| Server data (trips, plans, catalog) | TanStack Query (query keys from a central `queryKeys` factory) |
| Filters, sort, selected day, selected place | URL search params (typed with `nuqs` or a small Zod-parsed helper) |
| Multi-step form | React Hook Form + `zodResolver`, draft persisted to the server (debounced) |
| Ephemeral UI (open dialogs, hover-linked map marker) | Local component state / small React context per workspace |

There is no global client store. Adding Zustand or Redux requires a written reason.

### 4.4 Data fetching conventions

- Query keys: `['trips', tripId]`, `['trips', tripId, 'plan', version]`, `['catalog', destId, 'activities', filters]`.
- Mutations use **optimistic updates** for itinerary edits (reorder, lock, remove), roll back on error, then invalidate `['trips', tripId, 'plan']`.
- `staleTime`: catalog 10 min, plan 30 s, profile 5 min.
- A single typed fetcher (`apiFetch<T>(path, schema)`) parses every response with Zod and maps `problem+json` errors to `ApiError`.

### 4.5 Map

- **MapLibre GL JS** through `react-map-gl/maplibre` (vector tiles, no vendor lock-in). The tile source is configurable (MapTiler, Stadia or a self-hosted style).
- Loaded with `next/dynamic` and `ssr: false`, and only on routes that show a map.
- One `TripMap` component takes `places`, `legs` (GeoJSON LineStrings), `selectedId` and `onSelect`. The list and the map share selection through URL state (`?place=`).
- Fallbacks: if the map fails to load, show a static list of coordinates with "open in maps" links. Never show a blank panel.

### 4.6 Design system

Built on shadcn/ui primitives (Radix-based), restyled through tokens. It is not used with the default theme.

- **Tokens (CSS variables, Tailwind theme):** warm off-white background, white surface, near-black text, neutral-gray secondary text and borders, **one** brand accent with hover and subtle-tint variants. Semantic colours (success, warning, danger) are used only for status.
- **Type:** one professional sans (e.g. Inter or Geist, self-hosted with `next/font`). Fixed scale: 12 / 14 / 16 / 18 / 20 / 24 / 30. Page titles are 24–30, never hero-sized. Tabular numerals for money and times.
- **Spacing:** 8 px grid (4, 8, 16, 24, 32, 48, 64). Only these values appear in Tailwind config.
- **Radius:** inputs and buttons 8 px, cards 12 px, containers 0. Shadows only for popovers, menus and dialogs. Hierarchy comes from borders and spacing.
- **No** gradients, glassmorphism or decorative KPI tiles.

### 4.7 Responsive strategy (separate decisions, not scaling)

| Surface | Desktop ≥1280 | Tablet 768–1279 | Mobile <768 |
|---|---|---|---|
| Navigation | Fixed left sidebar with labels | Collapsed icon rail, labels in tooltips | Bottom tab bar (5 items) |
| Workspace tabs | Horizontal tab bar under header | Horizontal and scrollable | Scrollable segmented bar, sticky |
| Itinerary | 60 % timeline / 40 % sticky map | Timeline full-width, map in a resizable bottom panel | Timeline only, "Map" toggle opens full-screen map with a day picker |
| Hotels / Activities | Filters in a left column, 2–3 column list | Filters in a sheet, 2 columns | Filters in a bottom sheet, single column, horizontal image cards |
| Plan form | Step rail on the left, form on the right | Step indicator on top | Step "n of 5" header, sticky footer buttons |
| Budget | Table with columns (category, planned, % of total, range) | Same table, range collapses | Stacked rows, range in a disclosure |

### 4.8 Accessibility and i18n

WCAG 2.2 AA. All inputs have visible labels and use `aria-describedby` for errors. The map has a keyboard-accessible list alternative. Dates, numbers and currency go through `Intl` with the user's locale. UI strings are kept in message files from day one (`next-intl`), English first.

---

## 5. Backend architecture

### 5.1 Layering

```
Route Handler / Server Component        (delivery: auth, parse, map errors)
        │
        ▼
Module service (use case)               (authorization, transactions, orchestration)
        │                 │
        ▼                 ▼
Repository (Drizzle)   Ports → Adapters (providers, routing, FX)
        │
        ▼
PostgreSQL
                   Engines (pure) are called by services with plain data
```

- **Route Handlers** do only four things: authenticate, validate input (Zod), call one service method, and serialise the result or a `problem+json` error.
- **Services** take an explicit `ctx: { userId, requestId, clock, logger }`. That keeps them testable and stops hidden globals.
- **Repositories** return domain types, not Drizzle row types, and always take the owner scope as an argument.
- **Domain errors** are typed classes (`NotFoundError`, `ForbiddenError`, `ConflictError`, `BudgetInfeasibleError`, `ProviderUnavailableError`). A single mapper converts them to HTTP.

### 5.2 Plan generation pipeline (orchestrator)

```
1. Load brief                        → validate (Zod) & normalise (derive days/nights, rooms)
2. Build catalog snapshot            → candidate hotels/activities/restaurants for destination
                                       (hard filters applied in SQL: diet, child-suitable, category)
3. Enrich (parallel, cached)         → weather forecast, FX rate, routing matrix (lazy)
4. Budget engine – envelope pass     → category envelopes & per-night hotel allowance
5. Recommendation engine – activities→ ranked activities with scores
6. Compute activity anchor           → weighted centroid of top-K activities
7. Recommendation engine – hotels    → ranked hotels (budget fit uses allowance, location uses anchor)
8. Itinerary engine                  → days, ordered items, legs, meal slots, warnings
9. Budget engine – final pass        → actual planned spend per line, remaining, feasibility
10. Persist plan version (one tx)    → trip_plans + days + items + legs + budget_lines + recs
```

Steps 4 → 9 deal with the hotel / activity chicken-and-egg problem. The best hotel depends on where the activities are, and the affordable activities depend on what the hotel costs. The pipeline resolves this with an *envelope* pass first and a *reconciliation* pass at the end. If the reconciliation goes over budget by more than the reserve, the orchestrator runs **one** bounded repair iteration: try the next-ranked cheaper hotel, then drop the lowest-utility paid activities. After that it reports the plan as infeasible together with suggestions.

### 5.3 Runtime and deployment

- Node.js runtime for all Route Handlers. Edge is not used, because the database driver and engines need Node.
- Hosting: Vercel or a container platform, with managed PostgreSQL (e.g. Neon, RDS or Supabase Postgres). PgBouncer or the provider's pooled endpoint for serverless connections.
- Generation runs in the request in the MVP, with a budget of ~8 s and parallel cached enrichment. If p95 goes above that, generation moves to a worker (`pg-boss` on Postgres) behind the same `PlanGenerator` interface and API contract.

---

## 6. Database architecture

### 6.1 Principles

- PostgreSQL 16+. **Drizzle ORM** was chosen over Prisma for SQL-first schema, no binary engine, first-class SQL escape hatches (spatial and window queries) and small serverless cold starts.
- Primary keys are `uuid` (v7, time-ordered) generated in the application.
- Money is stored as `integer` minor units plus `char(3)` currency, never as floats.
- Timestamps are `timestamptz`. Itinerary local times are stored as `time` plus the destination's `tz` (IANA) on the trip.
- Soft delete only where users expect recovery (`trips.deleted_at`). Everything else is hard deleted.
- Coordinates are stored as `double precision lat/lng` with a B-tree on (`destination_id`), because MVP queries are scoped to a destination. Moving to PostGIS `geography(Point)` is planned for radius queries and multi-city trips.
- Migrations are generated by `drizzle-kit`, reviewed, and applied in CI or at deploy. Destructive changes are never made in the same release as the code change.

### 6.2 Entity overview

```
users ─┬─< accounts / sessions (Auth.js)
       ├── user_preferences
       ├─< trips ─┬── trip_briefs (1:1, current brief, JSONB validated by Zod)
       │          ├─< trip_plans (versions) ─┬─< itinerary_days ─< itinerary_items
       │          │                          │                  └─< itinerary_legs
       │          │                          ├─< budget_lines
       │          │                          └─< recommendation_results
       │          └─< generation_jobs
       ├─< saved_items ──> places | trips
       └─< interaction_events

destinations ─< places ─┬── hotel_details (1:1)
                        ├── activity_details (1:1)
                        ├── restaurant_details (1:1)
                        ├─< opening_hours
                        └─< place_tags >── tags

provider_cache · fx_rates · scoring_configs · audit_log
```

### 6.3 Core tables (key columns)

**Identity**
- `users(id, email unique, name, image, created_at)`
- `accounts`, `sessions`, `verification_tokens`: standard Auth.js Drizzle adapter schema
- `user_preferences(user_id pk/fk, currency, locale, home_place_label, home_lat, home_lng, default_pace, diet_flags text[], local_modes text[])`

**Catalog**
- `destinations(id, slug unique, name, country_code, tz, lat, lng, currency, cost_index numeric, is_active)`
- `places(id, destination_id fk, kind enum('hotel','activity','restaurant'), name, area, address, lat, lng, rating numeric(2,1), rating_count int, price_level smallint, images jsonb, external_refs jsonb, source enum('curated','provider'), updated_at)`
- `hotel_details(place_id pk, stars smallint, property_type, amenities text[], nightly_from_minor int, currency, max_occupancy smallint)`
- `activity_details(place_id pk, category, duration_min int, price_adult_minor int, price_child_minor int, min_age smallint, indoor bool, booking_required bool, best_time enum('morning','afternoon','evening','any'))`
- `restaurant_details(place_id pk, cuisines text[], diet_flags text[], meal_types text[], avg_price_pp_minor int)`
- `opening_hours(place_id, weekday smallint, opens time, closes time)` (several rows per day allowed)
- `tags(id, slug, group enum('interest','food','style','audience'))`, `place_tags(place_id, tag_id, weight numeric)`
- Indexes: `places(destination_id, kind)`, `place_tags(tag_id)`, GIN on `restaurant_details.diet_flags`, `hotel_details(stars)`

**Trips and plans**
- `trips(id, owner_id fk, destination_id fk, title, start_date, end_date, adults, children, status enum('draft','planned','archived'), current_plan_id fk null, created_at, updated_at, deleted_at)`
- `trip_briefs(trip_id pk, schema_version int, data jsonb, updated_at)`: the full validated brief. The columns on `trips` are a denormalised projection for listing.
- `trip_plans(id, trip_id fk, version int, engine_version text, scoring_config_id fk, catalog_snapshot_at timestamptz, status enum('ready','infeasible','superseded'), hotel_place_id fk, warnings jsonb, created_at)`, unique on (`trip_id, version`)
- `itinerary_days(id, plan_id fk, day_index, date, kind enum('arrival','full','departure'), start_time, end_time, base_place_id fk)`
- `itinerary_items(id, day_id fk, position int, kind enum('activity','meal','free','transfer'), place_id fk null, title, start_time, end_time, duration_min, cost_expected_minor, cost_low_minor, cost_high_minor, currency, locked bool, source enum('engine','user'), note)`, unique on (`day_id, position`), deferrable
- `itinerary_legs(id, day_id fk, from_item_id, to_item_id, mode, duration_min, distance_m, geometry jsonb /* GeoJSON LineString, simplified */)`
- `budget_lines(id, plan_id fk, category enum('accommodation','transport','food','activities','local_transport','reserve'), envelope_minor, planned_minor, low_minor, high_minor, currency, basis jsonb)`
- `recommendation_results(id, plan_id fk, place_id fk, kind, rank int, score smallint, breakdown jsonb, reasons text[], selected bool)`
- `generation_jobs(id, trip_id fk, idempotency_key unique, status enum('queued','running','succeeded','failed'), plan_id fk null, error jsonb, started_at, finished_at)`

**Saved, behaviour, operations**
- `saved_items(id, user_id, target_type enum('place','trip'), target_id, created_at)`, unique on (`user_id, target_type, target_id`)
- `interaction_events(id, user_id, trip_id, place_id, type enum('view','save','remove','swap','lock','reorder'), created_at)` (append-only, future learning signal)
- `scoring_configs(id, version, weights jsonb, created_at, is_active)`
- `provider_cache(key pk, provider, payload jsonb, fetched_at, expires_at)`
- `fx_rates(base, quote, rate numeric(18,8), as_of date)`, pk (`base, quote, as_of`)
- `audit_log(id, actor_id, action, entity, entity_id, meta jsonb, created_at)`

### 6.4 Data integrity rules

- `CHECK (end_date >= start_date)`, `CHECK (end_date - start_date <= 20)` (21 days at most in the MVP)
- `CHECK (adults >= 1 AND children >= 0 AND adults + children <= 10)`
- Item times: `CHECK (end_time > start_time)`. Overlap within a day is validated in the service and by property tests. A DB exclusion constraint is not used, because times are local and days are scoped.
- Writing a plan happens in one transaction. The previous `ready` plan becomes `superseded` atomically, and `trips.current_plan_id` is updated in the same transaction.

---

## 7. API structure

### 7.1 Conventions

- Base path `/api/v1`. JSON only. `camelCase` fields. ISO-8601 dates and times.
- Auth through a session cookie (`HttpOnly`, `Secure`, `SameSite=Lax`). Every mutation checks `Origin`.
- Requests and responses are defined by Zod schemas in `src/contracts`, shared by server and client. An OpenAPI document is generated from them (`zod-openapi`) for documentation and contract tests.
- Errors follow **RFC 9457 `application/problem+json`**: `{ type, title, status, detail, code, errors?: [{ path, message }] , requestId }`.
- Pagination is cursor-based (`?cursor=&limit=`, default 20, max 50).
- `Idempotency-Key` header is required on `POST …/generate`.
- Money in responses: `{ amountMinor: number, currency: "EUR" }`, plus a formatted string only if the client asks for it.

### 7.2 Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/me` | Current user and preferences |
| PATCH | `/me/preferences` | Update defaults |
| DELETE | `/me` | Account deletion (GDPR) |
| GET | `/me/export` | Data export |
| GET | `/destinations?query=` | Launch destination search |
| GET | `/places/geocode?query=` | Departure location autocomplete (proxied, rate-limited) |
| GET | `/trips?status=&cursor=` | List my trips |
| POST | `/trips` | Create trip (draft) from a partial brief |
| GET | `/trips/:tripId` | Trip header and current plan summary |
| PATCH | `/trips/:tripId` | Rename / update brief (draft autosave) |
| DELETE | `/trips/:tripId` | Soft delete |
| POST | `/trips/:tripId/generate` | Generate a new plan version (idempotent) |
| GET | `/trips/:tripId/jobs/:jobId` | Generation status |
| GET | `/trips/:tripId/plans/:version?` | Full plan (default: current) |
| GET | `/trips/:tripId/plan/itinerary` | Days, items, legs |
| PATCH | `/trips/:tripId/plan/items/:itemId` | Lock, unlock, edit time or note |
| POST | `/trips/:tripId/plan/days/:dayId/items` | Add item (from a recommendation or custom) |
| DELETE | `/trips/:tripId/plan/items/:itemId` | Remove item |
| PUT | `/trips/:tripId/plan/days/:dayId/order` | Reorder (array of item ids) |
| POST | `/trips/:tripId/plan/days/:dayId/optimize` | Re-optimise one day, keeping locks |
| GET | `/trips/:tripId/recommendations/hotels?sort=&filters` | Ranked hotels for this brief |
| GET | `/trips/:tripId/recommendations/activities?category=&sort=` | Ranked activities |
| PUT | `/trips/:tripId/plan/hotel` | Swap hotel (triggers budget recompute and leg recompute) |
| GET | `/trips/:tripId/plan/budget` | Budget summary and lines |
| GET | `/saved` · POST `/saved` · DELETE `/saved/:id` | Saved places and trips |

### 7.3 Edit semantics

Edits change the **current plan version in place** for small changes (reorder, lock, remove, add, re-optimise a day). A new version is created only by `generate` or a hotel swap. That keeps the version history meaningful without creating a version for every drag. Every edit recomputes the affected day's legs and times and the budget's `planned` totals inside the same transaction.

### 7.4 Generation contract

```
POST /trips/:id/generate   Idempotency-Key: <uuid>
→ 202 { jobId, status: "running" }            (worker mode)
→ 200 { jobId, status: "succeeded", planVersion } (MVP inline mode)
GET  /trips/:id/jobs/:jobId → { status, planVersion?, error? }
```

The client handles both responses, so moving to background workers is a backend-only change.

---

## 8. Recommendation engine architecture

### 8.1 Approach

A **content-based, multi-criteria scoring** engine with hard-constraint filtering, explainable component scores and diversity re-ranking. This is the right fit for the MVP: there is no interaction data yet (cold start), every score can be explained, and the results are deterministic. Collaborative or learned ranking can be added later, using `interaction_events` as training data.

```
candidates ──► hard filters ──► feature extraction ──► component scores (0..1)
          ──► weighted sum (config by travel style) ──► diversity re-rank (MMR)
          ──► top-N with score 0..100 + reasons
```

### 8.2 Hard filters (never relaxed silently)

- Diet flags (restaurants), child suitability (`min_age` vs. youngest child), capacity (rooms × occupancy), hotel stars within the chosen category (±1 only if the user allowed it), and open on at least one trip day.
- If filters leave fewer than *N* candidates, the engine returns a `relaxationSuggestions[]` list (e.g. "Allow 3★ hotels: +14 options"). It does not quietly loosen constraints.

### 8.3 Component scores

| Component | Activities | Hotels | Definition |
|---|---|---|---|
| Interest match | ✓ | — | Weighted Jaccard/cosine between the user's interest vector and `place_tags` weights |
| Quality | ✓ | ✓ | Bayesian rating: `(v/(v+m))·R + (m/(v+m))·C`, where *m* is the prior count and *C* is the destination mean. Low-volume ratings are pulled toward the mean. |
| Budget fit | ✓ | ✓ | Price vs. allowance. 1.0 up to the allowance, smooth decay above it, and a mild penalty when far below the allowance for `comfort`/`premium` styles. |
| Location | ✓ (vs. hotel/anchor) | ✓ (vs. activity anchor) | `exp(−t / τ)`, where *t* is estimated travel time with the preferred mode |
| Style fit | ✓ | ✓ | Tag affinity to the travel style (e.g. `premium` → guided/private experiences, design hotels) |
| Audience fit | ✓ | ✓ | Family amenities and child-friendly tags when children are present |
| Popularity | ✓ | — | Log-scaled `rating_count` within the destination. Small weight, to avoid only recommending famous sights. |

`score = Σ wᵢ·cᵢ`, scaled to 0–100. The weights live in `scoring_configs` (versioned, one profile per travel style). Each `trip_plan` records which config version produced it.

### 8.4 Diversity re-ranking

**Maximal Marginal Relevance** over category and area: `MMR = λ·score − (1−λ)·max_sim(selected)`, with λ≈0.7. This stops the result list from being five museums in one district.

### 8.5 Explanations

The engine returns the top 2–3 components by contribution as reason codes (`INTEREST_MATCH:architecture`, `NEAR_HOTEL:12`, `UNDER_BUDGET`). The UI turns them into short phrases. Reason codes are stored and kept stable, so copy can change without changing the engine.

### 8.6 Interface

```ts
rankActivities(input: RecInput, candidates: ActivityCandidate[], cfg: ScoringConfig): Ranked<Activity>[]
rankHotels(input: RecInput, candidates: HotelCandidate[], ctx: { allowance: Money; anchor: LatLng; travel: TravelTimeFn }, cfg): Ranked<Hotel>[]
```

The functions are pure. `TravelTimeFn` is injected, so tests use a haversine stub.

---

## 9. Itinerary engine architecture

### 9.1 Problem framing

A simplified **Team Orienteering Problem with Time Windows**: choose a subset of activities and order them across *D* days so that total utility (recommendation score) is maximised. The constraints are daily time capacity, opening hours, travel time, meal windows and budget. This is NP-hard, so the engine uses fast, deterministic heuristics with good quality on city-scale inputs (≤150 candidates, ≤21 days). The target is under 300 ms of CPU time.

### 9.2 Stages

1. **Day frames.** For each date, set `kind` (arrival / full / departure) and the available window based on pace: relaxed 10:00–18:00, moderate 09:00–20:00, packed 08:30–21:30. Arrival and departure days are cut using inbound/outbound time estimates. Meal windows are lunch 12:30–14:30 and dinner 19:30–21:30 (adjusted per destination).
2. **Selection.** Greedy by `utility = score / (duration + expected travel)`, subject to total time capacity, the activity budget envelope and category diversity caps (e.g. at most 2 museums per day). Locked items are always selected.
3. **Day assignment (geographic clustering).** Capacity-constrained k-medoids on travel time (haversine for the first pass), *k* = number of available days. Activities with fixed dates or opening days are assigned first. Clusters are balanced by total duration, not by count.
4. **Sequencing per day.** Open-route TSP from the hotel back to the hotel: nearest-neighbour construction, then **2-opt** improvement on the real travel-time matrix for that day (≤12 stops, so an exact matrix is cheap). Time windows are checked during 2-opt, and moves that break them are rejected.
5. **Meal insertion.** For each meal window, insert a restaurant slot at the point of minimum detour. The restaurant is chosen by the recommendation engine using diet and cuisine preferences, near that point.
6. **Scheduling.** Assign start and end times forward through the day, add buffers (10 min per transfer, 15 min after major sights), and snap to 5-minute steps.
7. **Repair and validation.** If a day overflows: drop the lowest-utility unlocked item, then move it to another day if there is room, or put it on the overflow list. Emit warnings (`CLOSED_ON_DAY`, `LONG_TRANSFER`, `TIGHT_SCHEDULE`, `OVER_BUDGET`).
8. **Legs.** For each consecutive pair, request route geometry and duration for the preferred mode (walk if ≤ the user's maximum walking time, otherwise transit or taxi according to preferences).

### 9.3 Edits and re-optimisation

- **Reorder:** keep the user's order exactly, recompute times and legs, warn about violations.
- **Re-optimise day:** run stages 4–7 for that day only. Locked items keep their position and time as anchors.
- **Add item:** insert at the minimum-cost position, unless the user dropped it at a specific position.

### 9.4 Determinism

Ties are broken by `place_id`, and there is no randomness. If a randomised improvement such as simulated annealing is ever added, it must use a seeded PRNG keyed by `trip_id + version`. `engine_version` is written to every plan, and golden tests pin the expected output (§14).

---

## 10. Budget engine architecture

### 10.1 Model

```
Total budget (user currency → destination currency at snapshot FX)
 ├─ Transport (inbound/outbound)   fixed estimate  (if included)
 ├─ Accommodation                  hotel nightly × nights × rooms + taxes
 ├─ Food                           per-person-per-day × days × party factor
 ├─ Activities                     Σ selected activities (adult/child prices)
 ├─ Local transport                per-day by mode mix × days × travelers
 └─ Reserve                        % of total (default 10 %, min 5 %)
```

### 10.2 Two passes

- **Envelope pass (before recommendations):** split the total into category envelopes using style-specific shares, adjusted by the destination `cost_index` and party composition. The output includes the **hotel nightly allowance** that the recommendation engine uses for budget fit.
- **Final pass (after the itinerary):** replace envelopes with *planned* amounts from the chosen hotel, the scheduled activities, meal slots (by `avg_price_pp` of the chosen restaurants, or a per-style default) and the local transport legs. Compute `remaining = total − Σ planned − reserve`.

### 10.3 Estimation rules

- Every line has **low / expected / high**. The UI shows *expected* and reveals the range on demand. The ranges come from price variance in the catalog and the confidence of the source (curated vs. provider vs. heuristic).
- Children: free under the activity's free age, child price if one is defined, otherwise the adult price. The food factor is 0.6 per child.
- Rooms: `rooms = max(ceil(adults / 2), ceil((adults + children) / max_occupancy))`.
- Inbound transport (MVP): a distance-band heuristic per mode. It is labelled "estimate" and the user can override it.
- All arithmetic uses integer minor units. Percentages are applied with banker's rounding, and the rounding residue goes to Reserve so that the lines sum exactly to the total.

### 10.4 Feasibility

If `Σ planned_low > total`, the plan status is `infeasible` and the engine returns ranked **suggestions**, each with its quantified effect: "Choose 3★ (−€240)", "Remove 1 night (−€180)", "Exclude transport from budget". The engine never cuts into the reserve without telling the user.

### 10.5 Invariants (property-tested)

- `Σ lines.planned + remaining == total` (exact, in minor units)
- No negative line
- `low ≤ expected ≤ high` for every line
- Changing the hotel changes only Accommodation, plus Local transport through the legs

---

## 11. External API integrations

All providers are reached through **ports** (TypeScript interfaces) with adapters in `src/server/integrations/*`. Each adapter validates responses with Zod, normalises them to catalog types, and is wrapped by a shared HTTP client with timeouts, retries (jittered, idempotent calls only), a circuit breaker and `provider_cache`.

| Port | Purpose | MVP adapter (candidates, final choice subject to terms/pricing) | Fallback |
|---|---|---|---|
| `Geocoder` | Departure/destination lookup | Mapbox Geocoding or MapTiler Geocoding | Destination list from the catalog; free-text origin with estimate disabled |
| `RoutingProvider` | Travel-time matrix and route geometry (walk / transit / drive) | OpenRouteService or Mapbox Directions/Matrix; transit via a GTFS-based service in a later phase | Haversine × mode speed × detour factor (1.3) |
| `MapTiles` | Basemap | MapTiler / Stadia vector style for MapLibre | Static list view |
| `WeatherProvider` | Forecast for trip dates (indoor/outdoor weighting) | Open-Meteo | Ignore the weather component |
| `FxProvider` | Currency conversion | ECB reference rates (daily job into `fx_rates`) | Last known rate, flagged as stale |
| `PlacesProvider` | Refresh ratings, hours and photos for the catalog | Google Places API or Foursquare Places | Curated data |
| `HotelProvider` | Live prices/availability (post-MVP) | Partner API (e.g. Booking.com Demand, Expedia Rapid, Hotelbeds) | Curated nightly-from price |
| `ActivityProvider` | Bookable experiences (post-MVP) | Viator / GetYourGuide partner APIs | Curated activities |
| `TransportEstimator` | Inbound transport cost | Heuristic (MVP); flight API later | User override |

**Caching TTLs:** geocoding 30 days, places 7 days, routing matrix 7 days (keyed by rounded coordinates and mode), weather 3 h, FX 24 h.
**Catalog ingestion:** a CLI script (`pnpm catalog:import <destination>`) loads curated YAML/CSV, validates it with Zod, upserts it and reports what changed. Provider refresh jobs only ever **enrich** curated records. They never delete them.
**Compliance:** attribution and display requirements are handled per provider (map attribution, photo credits). Provider content is stored only where the terms allow it, and the cache TTLs follow those terms.

---

## 12. Validation and error handling

### 12.1 Validation layers

| Layer | Tool | What |
|---|---|---|
| Environment | Zod (`src/server/platform/env.ts`) | Fail fast at boot if a variable is missing or malformed. Server and client variables are separate. |
| Form (client) | React Hook Form + Zod | Field- and step-level inline validation on blur and on step change |
| API boundary | Same Zod contracts | Every request body, param and query is parsed. Unknown keys are stripped. |
| Domain | Service invariants | Ownership, state transitions (`draft → planned`), edit conflicts |
| Provider responses | Zod | Treated as untrusted input. Invalid payloads are logged and the fallback is used. |
| Database | Constraints / FKs / CHECKs | Last line of defence |

### 12.2 Brief validation rules (examples)

- `startDate ≥ today` (in the destination's time zone), `endDate ≥ startDate`, at most 21 days.
- `adults ≥ 1`, total party ≤ 10, `childAges.length === children`, each age 0–17.
- `budget.amount > 0`. A **soft** warning if it is below the destination's minimum viable per person per day (computed from `cost_index`). This is a warning, not a block, because the feasibility engine gives better guidance.
- At least one interest. Local modes are not empty. `maxWalkMinutes` is between 5 and 60.
- Origin and destination differ.

### 12.3 Error handling

- **Typed domain errors** → one mapper → `problem+json` with a stable `code` (`TRIP_NOT_FOUND`, `BRIEF_INVALID`, `BUDGET_INFEASIBLE`, `PROVIDER_UNAVAILABLE`, `RATE_LIMITED`, `EDIT_CONFLICT`).
- **Unexpected errors** → 500 with `requestId`. Details go to logs only, never to the client.
- **Degradation over failure:** if routing fails, use haversine estimates and add a `ROUTING_ESTIMATED` warning. If weather fails, skip it. A plan is never failed because an optional enrichment failed.
- **Concurrency:** plan edits send the plan `updatedAt` as an `If-Match` style precondition. A stale write returns 409 `EDIT_CONFLICT` and the client refetches.
- **UI:** `error.tsx` per route segment, inline field errors, toasts only for transient mutation failures (with Retry), and empty states that offer a next action.

---

## 13. Security requirements

| Area | Requirement |
|---|---|
| Authentication | Auth.js (NextAuth v5) with email magic link and Google OAuth. Database sessions (revocable). Session rotation on sign-in. |
| Authorization | Every service method takes `ctx.userId`. Repositories always filter by `owner_id`. A non-owned resource returns **404, not 403**, to avoid revealing that it exists. Authorization tests exist per endpoint. |
| CSRF | `SameSite=Lax` cookies plus an `Origin`/`Host` check on all non-GET requests |
| Input | Zod at every boundary. Body size limit (64 KB). Strings are length-capped. No raw SQL built from strings; Drizzle `sql` template only. |
| Output / XSS | React escaping. No `dangerouslySetInnerHTML`. Provider text is rendered as text only. Image domains are allow-listed in `next.config`. |
| Headers | Strict CSP (nonce-based scripts; map tile, image and API hosts allow-listed), HSTS, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `frame-ancestors 'none'`, `Permissions-Policy` (geolocation only when the user asks) |
| Secrets | Server-only env vars and the `server-only` import guard. Only a domain-restricted public map token reaches the client. Secrets are rotated on schedule and kept in the platform secret store. |
| Rate limiting | Per user and per IP. `generate` is limited to 10/hour, geocode proxy 60/min, auth endpoints strict. Implemented with Postgres or Redis (Upstash). |
| Abuse / cost | Provider calls only happen server-side through the cache. Per-user daily provider budget. Circuit breakers stop cascading costs. |
| Privacy | Minimal personally identifiable information (email, name, optional home city). No passport or payment data in the MVP. Data export and deletion endpoints. Logs contain ids only, never emails or briefs. Retention is defined for `interaction_events` (13 months). |
| Dependencies | Lockfile, Renovate, `pnpm audit` / OSV scan in CI, CodeQL |
| Auditing | `audit_log` for account deletion, export, plan generation and sign-in events |

---

## 14. Testing strategy

| Level | Tooling | Scope | Gate |
|---|---|---|---|
| Static | `tsc --strict` (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`), ESLint with boundaries, Prettier | Whole repo | Pre-commit + CI |
| Unit | Vitest | Engines, Zod schemas, money utilities, mappers | ≥90 % line coverage on `recommendation`, `itinerary`, `budget` |
| Property-based | `fast-check` | Engine invariants: budget sums exactly; no overlapping items; items inside opening hours; locked items preserved; deterministic output | CI |
| Golden / snapshot | Vitest + fixture briefs | 10–15 reference briefs per launch city → expected plan JSON. Diffs require an `engine_version` bump. | CI |
| Integration | Vitest + **Testcontainers PostgreSQL** | Repositories, migrations, services with a real database, authorization scoping | CI |
| API / contract | Route handler tests + MSW for providers, OpenAPI conformance | Status codes, `problem+json` shapes, adapter normalisation from recorded fixtures | CI |
| Component | Testing Library | Form steps, validation messages, itinerary edit interactions | CI |
| E2E | Playwright | Sign in → plan → generate → edit → budget → save, on desktop, tablet and mobile viewports | CI on main + preview deploys |
| Accessibility | `@axe-core/playwright` | Every primary route | CI (no serious or critical issues) |
| Performance | Engine micro-benchmarks; Lighthouse CI on key routes | Engine < 300 ms CPU for 150 candidates × 7 days; LCP < 2.5 s | Tracked, warn on regression |

Test data uses factories (`@faker-js/faker` with a fixed seed) and a small deterministic seed catalog for one city.

---

## 15. Folder structure

```
.
├── docs/
│   ├── ARCHITECTURE.md
│   └── adr/                          # Architecture Decision Records (0001-drizzle.md, …)
├── drizzle/                          # generated SQL migrations
├── catalog/                          # curated destination data (YAML/CSV) + images manifest
├── scripts/                          # catalog:import, fx:sync, seed
├── e2e/                              # Playwright specs + fixtures
├── public/
├── src/
│   ├── app/
│   │   ├── (auth)/sign-in/page.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx            # sidebar / rail / bottom-nav shell
│   │   │   ├── overview/page.tsx
│   │   │   ├── plan/page.tsx
│   │   │   ├── trips/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [tripId]/
│   │   │   │       ├── layout.tsx    # trip header + workspace tabs
│   │   │   │       ├── page.tsx      # → overview
│   │   │   │       ├── itinerary/page.tsx
│   │   │   │       ├── map/page.tsx
│   │   │   │       ├── hotels/page.tsx
│   │   │   │       ├── activities/page.tsx
│   │   │   │       └── budget/page.tsx
│   │   │   ├── saved/page.tsx
│   │   │   └── profile/page.tsx
│   │   ├── api/v1/…/route.ts         # thin route handlers
│   │   ├── layout.tsx
│   │   └── globals.css               # design tokens
│   ├── components/
│   │   ├── ui/                       # shadcn/ui primitives (restyled)
│   │   └── shell/                    # sidebar, page header, nav
│   ├── features/                     # client feature slices (UI + hooks)
│   │   ├── plan-form/                # steps, schema wiring, draft autosave
│   │   ├── trip-workspace/
│   │   ├── itinerary/                # timeline, edit interactions
│   │   ├── map/                      # TripMap (dynamic, client-only)
│   │   ├── hotels/
│   │   ├── activities/
│   │   ├── budget/
│   │   └── saved/
│   ├── contracts/                    # Zod schemas shared by client & server (brief, trip, plan, errors)
│   ├── lib/
│   │   ├── api-client.ts             # apiFetch + ApiError
│   │   ├── query-keys.ts
│   │   ├── query-client.ts
│   │   ├── money.ts                  # minor-unit arithmetic & formatting
│   │   └── dates.ts
│   └── server/                       # import 'server-only'
│       ├── platform/                 # env, db client, logger, errors, rate-limit, http, clock
│       ├── db/schema/                # Drizzle table definitions per module
│       ├── modules/
│       │   ├── identity/  { service.ts, repo.ts, types.ts }
│       │   ├── catalog/
│       │   ├── trips/
│       │   ├── planning/             # orchestrator, generation jobs
│       │   └── saved/
│       ├── engines/                  # PURE — no imports from db/integrations/next
│       │   ├── recommendation/
│       │   ├── itinerary/
│       │   └── budget/
│       └── integrations/
│           ├── ports.ts
│           ├── geocoding/ routing/ weather/ fx/ places/
│           └── http/                 # client, retry, circuit breaker, cache
├── tests/                            # integration tests (Testcontainers) + fixtures
├── drizzle.config.ts
├── next.config.ts
├── vitest.config.ts
├── playwright.config.ts
└── tsconfig.json                     # strict + noUncheckedIndexedAccess + exactOptionalPropertyTypes
```

Unit tests sit next to the code (`*.test.ts`). Integration tests live in `tests/`, and E2E tests live in `e2e/`.

---

## 16. Non-functional targets

| Concern | Target |
|---|---|
| Plan generation | p95 ≤ 8 s end-to-end (MVP inline), engine CPU ≤ 300 ms |
| API latency | p95 ≤ 300 ms for reads, ≤ 600 ms for edits |
| Frontend | LCP ≤ 2.5 s on mid-range mobile; map JavaScript loaded only on routes that show a map |
| Availability | 99.5 % (MVP) |
| Observability | Structured logs (pino) with `requestId`; OpenTelemetry traces across orchestrator stages; Sentry for errors; metrics for generation duration, infeasible rate, provider error rate and cache hit rate |

---

## 17. Decisions to confirm before implementation

1. **Launch destinations** and who curates the catalog data, including image licensing.
2. **Map and routing vendor.** This depends on pricing at the expected volume and whether transit routing is needed in the MVP.
3. **Budget scope default:** does the total include inbound transport? Proposed default: yes.
4. **Currency set:** EUR, USD and GBP for the MVP?
5. **Auth providers:** magic link and Google enough, or is Apple required?
6. **Hosting:** Vercel plus managed Postgres, or containers, if workers are expected soon.

Each confirmed decision is recorded as an ADR in `docs/adr/`.
