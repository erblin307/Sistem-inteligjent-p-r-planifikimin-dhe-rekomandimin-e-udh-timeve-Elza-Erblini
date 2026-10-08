# Presentation plan

Smart Travel Planner, an intelligent travel planning and recommendation system. The app is called **Itinera** in the code and the UI.

This is the plan for the university presentation and defense. It has two companion documents:

- [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md): the live demo, step by step, with a backup plan
- [`DEFENSE_QUESTIONS.md`](DEFENSE_QUESTIONS.md): likely jury questions, with answers taken from the code
- [`PRESENTATION_REVIEW_FINDINGS.md`](PRESENTATION_REVIEW_FINDINGS.md): code issues found while preparing this material. Nothing was changed.

Everything below was checked against the repository on 2026-10-08 (commit `66a00b8`). When the code changes, check §1 again before presenting.

---

## 1. What the presentation may claim

The presentation must describe the system that exists, not the one in the architecture plan. `docs/ARCHITECTURE.md` is a design document: much of it (itinerary engine, budget engine, routing, MapLibre, Auth.js, TanStack Query, provider adapters) is **planned, not built**. The real recommendation engine is described in `docs/RECOMMENDATION_ENGINE.md`.

### 1.1 Status of each part

| Part | Status | Evidence |
|---|---|---|
| Trip brief form, 7 steps, "Plan a Trip" | **Working** | `src/components/travel/trip-planner.tsx`, `/plan` |
| Brief validation (client and server, same rules) | **Working** | `src/contracts/trip-brief.ts` → `validateTripBrief`, used by the form and by `POST /api/v1/trips/generate` |
| `POST /api/v1/trips/generate` | **Working, narrow.** Validates the brief, accepts only Barcelona, returns a redirect to the Barcelona workspace. It does not generate or store anything. | `src/app/api/v1/trips/generate/route.ts`, `src/server/modules/trips/create-trip.ts` |
| Recommendation engine (hotels and activities) | **Implemented, not connected.** Pure, deterministic, explainable weighted scoring. No page or route calls it yet. | `src/server/engines/recommendation/engine.ts` |
| Trip workspace: Overview, Itinerary, Map, Hotels, Activities, Budget | **UI built, data is a fixture.** Every tab reads the static Barcelona sample in `src/lib/fixtures/barcelona.ts`. Scores shown there (92, 86, 94…) are typed into the fixture, not computed. | `src/app/(app)/trips/[tripId]/*` |
| Map | **Placeholder.** An SVG drawing with three numbered markers and a line. No map library, no tiles, no real coordinates. | `src/components/travel/map-canvas.tsx` ("stand-in until the MapLibre integration is connected") |
| Budget page | **Calculation is real, inputs are fixture.** Planned spend, reserve and remaining are computed from the budget lines. | `src/components/travel/budget-breakdown.tsx` |
| Database (PostgreSQL 16, Drizzle ORM) | **Working.** 17 tables, one migration, CHECK constraints, owner scoping. | `src/server/db/schema/*`, `drizzle/0000_initial_schema.sql` |
| REST API for trips and destinations | **Working with a database.** `GET/POST /trips`, `GET/DELETE /trips/:id`, `GET /destinations`, `GET /destinations/:id`. Not used by the UI yet. | `src/app/api/v1/*`, `src/server/modules/*` |
| Sign-in | **Not built.** A development stand-in (`DEV_AUTH_EMAIL`) acts as one user outside production. | `src/server/platform/auth.ts` |
| Design system | **Working.** Tokens, restyled shadcn/ui components, a lint script that blocks off-system styles, light and dark tokens (theme toggle only on `/design-system`). | `docs/DESIGN_SYSTEM.md`, `/design-system` |
| Automated tests | **98 tests, all passing** with PostgreSQL 16 (33 contract, 27 database, 38 API). Without a database, 65 are skipped. | `tests/` |
| Itinerary engine, route optimisation, budget engine | **Designed only** | `docs/ARCHITECTURE.md` §9, §10 |
| External providers (maps, routing, places, hotels, flights, weather, FX) | **None integrated.** No API keys are needed. | No `src/server/integrations/` folder exists |
| AI Travel Assistant / chat | **Does not exist** | No code |
| Flights | **Does not exist** | No code |
| Saved trips and saved places | **Database tables only.** The Saved page is an empty state. | `src/server/db/schema/saved.ts`, `/saved` |
| Multiple destinations | **Only Barcelona.** Any other destination returns "Barcelona is the only destination available in the current catalog preview." | `create-trip.ts` |

### 1.2 Consequences for the slides

- The intelligent part to present is the **recommendation engine**. Show it through its formula, a worked example with real output (§4, slide 9) and, optionally, a terminal run (see the demo script).
- Present the workspace honestly as "the interface the engine will feed", showing sample data.
- Do not present an AI assistant, flights, routing, a live map, saved trips or live provider data.
- Present the itinerary engine, budget engine and route optimisation as **designed next steps**, under Future development.

### 1.3 Vocabulary

Use the names the app uses. Do not invent new ones.

| Use | Not |
|---|---|
| Smart Travel Planner (on the title slide), **Itinera** (the app) | Travel Builder, Journey Generator, Smart Trip Maker |
| Plan a Trip, trip brief | Trip creator, wizard |
| Generate My Trip | Build plan |
| Trip workspace, with the tabs Overview, Itinerary, Map, Hotels, Activities, Budget | Dashboard, Accommodation module |
| My Trips, Saved Places | Saved trips (it is not built) |
| Recommendation engine | AI, model, neural network |
| Match score (0–100), score breakdown, reasons | Confidence, probability |
| Travel style: Budget, Balanced, Comfort, Luxury | — |
| Development fixture, sample data | Real data, live data |

---

## 2. Storyline

```
Problem
  ↓
Solution (what was built)
  ↓
How the user uses it (the trip brief)
  ↓
Architecture
  ↓
Intelligent recommendation logic   ← the core of the talk
  ↓
Trip workspace and data
  ↓
Live demo
  ↓
Testing and reliability
  ↓
Limitations and current status
  ↓
Future development
  ↓
Conclusion
```

The audience should leave knowing three things: what problem it solves, how a score is calculated, and what is finished versus planned.

---

## 3. Academic metadata

Nothing in the repository states the university, course, supervisor or academic year. The repository name includes the authors' names (Elza, Erblin). Fill these in by hand before presenting:

- Authors: `[full names]`
- University and faculty: `[ ]`
- Course: `[ ]`
- Supervisor: `[ ]`
- Academic year: `[ ]`

---

## 4. Full version (10–12 minutes, 16 slides)

Timing: about 7 minutes of slides plus 3 minutes of demo, leaving a margin. Seconds per slide are a guide.

### Slide 1. Title (15 s)

**On the slide**

> **Smart Travel Planner**
> Intelligent Travel Planning and Recommendation System
>
> Itinera · `[authors]` · `[university, course]` · `[academic year]`

**Speaker notes**

Say the name and one sentence: "A web application that turns a traveler's preferences and budget into ranked, explained hotel and activity recommendations." Do not explain features yet.

---

### Slide 2. The problem (40 s)

**On the slide**

- Travel information is spread across many sites
- Hotels, activities and budget are planned separately
- Generic rankings ignore budget, party size and interests
- Users cannot see *why* something is recommended
- Total cost is hard to keep under control

**Speaker notes**

Use one concrete example: two people planning six days in Barcelona with €1,500. They compare hotels on one site, look up Sagrada Família on another, and keep the budget in a spreadsheet. A "top 10 hotels" list does not know they have €1,500 for everything.

Do not quote statistics. None are backed by this project.

Next: "So we built one place where the preferences come first."

---

### Slide 3. The solution (40 s)

**On the slide**

```
One trip brief  →  one trip workspace

• Structured trip brief with validation
• Recommendation engine: ranked hotels and activities,
  each with a 0–100 score and reasons
• Workspace: Overview · Itinerary · Map · Hotels · Activities · Budget
• Budget overview: planned, reserve, remaining
• PostgreSQL data model and REST API for trips and destinations
```

**Speaker notes**

Be precise about what is finished: the brief, the engine, the database and API, and the workspace interface. Say now, once, that the workspace currently shows a Barcelona sample trip and that connecting the engine to it is the next step. Saying this early builds trust and avoids a hard question later.

Next: "It starts with what the traveler tells us."

---

### Slide 4. What the system learns from the traveler (45 s)

**On the slide**

| Input | Becomes |
|---|---|
| Departure, destination | Catalog filter (eligibility) |
| Start and end date | Number of days and nights (derived) |
| Adults, children | Rooms needed, group-size limits |
| Total budget (EUR) | Hotel and activity allowances |
| Travel style | Share of budget for hotel and activities, target star level |
| Hotel category | Star preference |
| Activity interests | Interest match |
| Transportation | Location score |
| Food preferences | Diet filter, cuisine match |

**Speaker notes**

Key idea: every input becomes a **constraint or a scoring signal**. Days are never typed in. They come from the dates, so they cannot contradict them.

Mention the validation limits only if asked: trips up to 21 days, at most 10 travelers, start date not in the past, at least one interest and one transport mode.

Term to name: "minor units". Money is stored as integer cents (150000 = €1,500) to avoid rounding errors.

Next: "This is how the user moves through the app."

---

### Slide 5. User flow (30 s)

**On the slide**

```
Plan a Trip
  Destination → Travelers → Budget → Accommodation
  → Interests → Preferences → Review
      ↓  Generate My Trip
  Brief validated (browser and server)
      ↓
Trip workspace
  Overview · Itinerary · Map · Hotels · Activities · Budget
```

**Speaker notes**

These are the real step names from the form. The same validation function runs in the browser and on the server, so the server never trusts the browser.

Do not claim that "Generate My Trip" runs the engine. It validates and opens the workspace.

---

### Slide 6. System architecture (60 s)

**On the slide**

```
Browser (React, Next.js App Router)
        │
Next.js route handlers  /api/v1   (validation, errors as problem+json)
        │
Module services  (trips, destinations)
   │                         │
Repositories (Drizzle)    Recommendation engine
   │                      (pure function, no I/O)
PostgreSQL 16
```

Stack: Next.js 16, React 19, TypeScript (strict), PostgreSQL 16, Drizzle ORM, Zod, Tailwind CSS v4, shadcn/ui, Vitest.

**Speaker notes**

This is a **modular monolith**: one application, with domain code in `src/server`, separate from the framework. Route handlers only parse input, call one service and format the result. The engine has no database, network, clock or randomness, which makes it testable and reproducible.

Do not show the full architecture document. If asked about planned modules (itinerary, budget, routing engines), say they are designed in `ARCHITECTURE.md` and not built yet.

Next: "The interesting part is the engine."

---

### Slide 7. What makes the system intelligent? (60 s)

**On the slide**

1. **Eligibility filters**: wrong city or currency, group too large or small, or a diet the place cannot serve → excluded (score 0)
2. **Multi-criteria scoring**: six components, each 0–100
3. **Budget-aware**: the budget is split by travel style into hotel and activity allowances
4. **Preference-aware**: stars, hotel type, travel style, interests, transport, food
5. **Weighted ranking**: weighted sum → 0–100 match score
6. **Explainable**: full breakdown and up to three reasons per result
7. **Deterministic**: the same input always gives the same ranking

**Speaker notes**

Say plainly: this is a **content-based, multi-criteria recommendation system**, not machine learning. That is deliberate: there is no user history to learn from (the cold-start problem), and every score has to be explainable.

Do not say "AI generates the trip".

Next: "Here is the formula."

---

### Slide 8. Recommendation algorithm (60 s)

**On the slide**

```
1. Validate the profile and every candidate
2. Eligibility: destination, currency, group size, diet
3. Score six components (0–100 each)
4. Weighted sum → match score (0–100)
5. Generate up to 3 reasons from the strongest matches
6. Sort: eligible first → score ↓ → id (stable ties)
```

| Component | Hotel weight | Activity weight |
|---|---:|---:|
| Budget match | 30% | 25% |
| Preference match | 20% | 15% |
| Location match | 20% | 20% |
| Activity (interest) match | 15% | 25% |
| Rating score | 10% | 10% |
| Food match | 5% | 5% |

**Speaker notes**

Explain the weights: for a hotel, price matters most. For an activity, price and interest weigh the same.

How the budget allowance is derived (one sentence each):

- Hotel: total budget × style share (Budget 32%, Balanced 40%, Comfort 48%, Luxury 56%) ÷ nights ÷ rooms. An explicit nightly limit overrides it.
- Activity: total budget × style share (12%, 18%, 22%, 26%) ÷ days ÷ travelers, per person per day.
- Over the allowance, the budget score drops by 2 points per 1% over (for example, 50% over gives 0).

Rating is the 0–5 rating scaled to 0–100, and pulled down by up to 15% when there are fewer than 1,000 reviews.

Next: "Let's see it on two real hotels."

---

### Slide 9. Worked example, real engine output (60 s)

**On the slide**

Profile: Barcelona, 6 days, 2 adults, €1,500, Balanced, 4★ preferred, interests architecture and museums, walk and public transport.
Hotel allowance: €1,500 × 40% ÷ 5 nights = **€120 per night**.

| | Hotel Casa Fuster | Praktik Bakery |
|---|---:|---:|
| Price per night | €142 | €118 |
| Stars | 4★ | 3★ |
| Budget match (×0.30) | 63.3 | 100 |
| Preference match (×0.20) | 96 | 82.5 |
| Location match (×0.20) | 87.8 | 100 |
| Activity match (×0.15) | 50 | 50 |
| Rating score (×0.10) | 92 | 88 |
| Food match (×0.05) | 100 | 100 |
| **Match score** | **78** | **88** |

Reasons for Praktik Bakery: "Within your accommodation budget at €118 per night." · "Well located for your preferred transportation mode." · "Near activities that match architecture."

**Speaker notes**

This is real output from `buildRecommendations`. Hotel facts (price, stars, rating, reviews, distance) come from the Barcelona development fixture. `nearbyActivityTags: ["architecture"]` and hotel type "hotel" were added for the example because the fixture does not carry them. The command to reproduce it is in `DEMO_SCRIPT.md` §5.

Point out the trade-off: Casa Fuster matches the 4★ wish exactly, but it is €22 over the allowance per night, and that costs it more than the star preference gains. This is the engine "thinking" in terms the jury can check by hand.

Activity match is 50 because each hotel is near one of the two selected interests.

Be ready for: "The Hotels tab shows Casa Fuster at 92." Answer: that tab shows fixture values typed in by hand. The engine is not connected to it yet. This is listed in the limitations.

---

### Slide 10. Trip workspace (45 s)

**On the slide**

Screenshot of the Itinerary tab (sample trip), with the day it shows:

```
Tuesday, 13 July · sample data
09:00  Breakfast · Café Cosmo
10:30  Sagrada Família        14 min walk · 1.1 km   Booked
13:00  Lunch · La Paradeta     6 min walk
15:00  Park Güell             22 min transit · 3.2 km   Book ahead
17:45  Bunkers del Carmel     25 min walk
20:30  Dinner · Bar Canete    18 min taxi
€252 planned
```

**Speaker notes**

Show what a plan looks like to the user: times, durations, travel legs between stops, booking status and the cost per day. Numbered stops match the markers on the map panel.

Say clearly: this day is sample data that defines the target output format (it mirrors the `itinerary_items` table). The map is a drawn placeholder, not a map service. The engine that would fill this day automatically (selection, grouping by area, ordering, scheduling) is designed but not built.

---

### Slide 11. Budget overview (40 s)

**On the slide**

```
Sample trip, €1,500 total
Accommodation     €710   5 nights × €142, 1 room
Transport         €150   return flights, estimate
Food              €240   €24 per person per day
Activities        €124   5 paid activities, 2 people
Local transport    €60
Planned spend   €1,284
Reserve           €150   10% of total
Remaining          €66
```

**Speaker notes**

The figures are fixture values. The calculation is real code: planned = all lines except the reserve, remaining = total − planned − reserve. A negative remaining is shown in the danger colour.

Each line carries its basis ("5 nights × €142"), so the user can see where a number comes from. In the database, `budget_lines` enforces `low ≤ planned ≤ high` and non-negative amounts.

---

### Slide 12. Data and persistence (45 s)

**On the slide**

- PostgreSQL 16 through Drizzle ORM, 17 tables, versioned migration
- Trips belong to a user. Every query filters by owner. Another user's trip answers 404.
- The schema already versions plans (`itineraries`), with only one active per trip
- Money as integer minor units plus currency. Dates as ISO dates.
- Rules enforced in the database too: CHECK constraints, unique keys, foreign keys
- Not yet: the workspace UI reads sample data, not the database

**Speaker notes**

Be honest about the split: the trips API stores and reads trips from PostgreSQL, and 65 tests prove it. The Plan a Trip form does not save the trip yet, and the workspace does not read from the database yet. Nothing is stored in the browser (no localStorage).

Separation between trips: `trips.user_id`, and every repository function takes the owner id. A test checks that user B cannot read user A's trip.

---

### Slide 13. Live demo (3 min)

Follow [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md). The slide itself only says "Demo".

---

### Slide 14. Testing and reliability (50 s)

**On the slide**

| Area | What is tested | Tests |
|---|---|---:|
| Contracts | Brief parsing, defaults, derived dates, duplicates removed | 33 |
| Database | Constraints, cascades, owner isolation, catalog protection | 27 |
| API | Status codes, `problem+json` errors, auth, cross-site requests, 404 for other users' trips | 38 |
| **Total** | Vitest 5 against a real PostgreSQL 16 | **98, all pass** |

Also run: TypeScript strict type check, ESLint, a design-token lint, production build.

Reliability:
- Validation at every boundary (form, API, database)
- Errors as RFC 9457 `problem+json`. Unexpected errors return a generic 500 and are logged with a request id.
- Request body limit 64 KB, same-origin check on mutations
- Secrets only in environment variables, validated at use. Sign-in stand-in is ignored in production.

**Speaker notes**

Say directly that the recommendation engine has no automated tests yet. It is the next test to write. Its determinism makes golden tests easy.

Do not claim end-to-end, accessibility or performance tests. They are planned only.

---

### Slide 15. Limitations and current status (50 s)

**On the slide**

- Engine implemented but not yet connected to the interface
- Workspace shows one Barcelona sample trip
- Only Barcelona accepted as a destination
- Itinerary, route and budget engines designed, not built
- Map is a placeholder, with no routing provider
- No sign-in, so the trips API uses a development user
- No live prices or availability, no booking or payment
- Catalog prices and ratings are illustrative development fixtures
- Scoring weights set by hand, not learned from data

**Speaker notes**

Present this as engineering judgement, not as apology: the foundation (data model, validation, API, engine) was built and tested before the integrations. A professor will respect a clear line between "done" and "designed" more than a demo that hides it.

---

### Slide 16. Future development, then conclusion (40 s)

**On the slide: future development**

1. Connect the engine to the Hotels and Activities tabs and store results in `recommendations`
2. Itinerary engine: group by area, order with nearest neighbour + 2-opt, schedule meals (designed in ARCHITECTURE §9)
3. Budget engine: allowance pass and final pass, feasibility suggestions (§10)
4. Map with MapLibre and a routing provider, with a straight-line fallback
5. Sign-in (Auth.js) and saved trips in the database
6. More destinations and a curated catalog import
7. Feedback-based tuning of weights

**On the slide: conclusion**

- One structured brief replaces scattered planning inputs
- Recommendations are scored by budget, preferences, location, interests, rating and food, and every score is explained
- A tested data model and API are ready for the planner and engines to connect to

**Speaker notes**

End on the three points, then: "Thank you. We are happy to take questions." Do not end on the limitations slide.

---

## 5. Short version (3–5 minutes, 7 slides)

The same story, compressed. Each slide maps to slides of the full version.

| # | Slide | Content (from full version) | Time |
|---|---|---|---:|
| 1 | Problem and solution | Title, 3 problem bullets, one-line solution (slides 1–3) | 35 s |
| 2 | How the system works | The inputs table, shortened to 6 rows, and the 7 form steps (slides 4–5) | 30 s |
| 3 | Recommendation algorithm | Six components with weights, eligibility, determinism (slides 7–8) | 40 s |
| 4 | Worked example | Casa Fuster 78 vs Praktik Bakery 88, with reasons (slide 9) | 35 s |
| 5 | Architecture and data | Layer diagram and PostgreSQL bullets (slides 6, 12) | 30 s |
| 6 | Demo or result | Short demo (DEMO_SCRIPT §4), or screenshots of the brief and the workspace | 60 s |
| 7 | Testing, status, conclusion | 98 tests, top 4 limitations, 3 conclusion points (slides 14–16) | 35 s |

**Speaker notes (short version)**

1. "Planning a trip means juggling hotels, activities and a budget on different sites. We built one place where the preferences and the budget come first."
2. "The traveler fills a seven-step brief. Each answer becomes a constraint or a score signal. For example, the budget and travel style set a nightly hotel allowance."
3. "The engine filters out what cannot work, scores six criteria, and ranks by a weighted sum. Budget matters most for hotels, interests and budget most for activities. Same input, same output."
4. "With €1,500 and a 4-star wish, the cheaper 3-star hotel wins, 88 to 78, because the 4-star is €22 over the nightly allowance. The engine says why in plain words."
5. "Next.js and TypeScript, a pure engine with no I/O, PostgreSQL with constraints that back up validation."
6. Demo: brief → Generate My Trip → workspace tabs. Say that the workspace shows the sample trip.
7. "98 automated tests pass. The engine is not yet wired into the interface, and itinerary and routing are designed, not built. Those are the next steps."

---

## 6. Whiteboard explanations

### 6.1 Algorithm (under 60 seconds)

```
Trip brief: budget · style · days · travelers · stars · interests · transport · food
        │
        ▼  eligibility (city, currency, group size, diet)
Candidates that can work
        │
        ▼  6 component scores, each 0–100
budget · preference · location · interest · rating · food
        │
        ▼  weighted sum (hotel: 30/20/20/15/10/5)
Match score 0–100 + 3 reasons
        │
        ▼  sort: eligible → score → id
Ranked recommendations
```

Formula to write:

```
score = 0.30·budget + 0.20·preference + 0.20·location
      + 0.15·interest + 0.10·rating + 0.05·food        (hotel)
```

### 6.2 Architecture (easy to draw)

```
Browser (React)
     ↓
Route handlers /api/v1   ← validation, errors
     ↓
Services (trips, destinations)
     ↓                ↘
Repositories          Recommendation engine (pure)
     ↓
PostgreSQL
```

Then point at the empty boxes for future work: itinerary engine, budget engine, routing and map provider, sign-in.

---

## 7. Slide design

Follow the spirit of `docs/DESIGN_SYSTEM.md` ("clean, restrained, editorial… when in doubt, remove").

- Background off-white `#F6F6F3` or white. Text near-black `#17191C`. One accent: Harbour `#1D5A72`. Status colours only for status.
- One sans-serif font (the app uses Instrument Sans). Large titles, body text at least 20 pt.
- At most 5 bullets per slide, one idea per slide.
- Tables and diagrams instead of paragraphs. Money and times right-aligned with tabular numbers.
- Screenshots full-width with a one-line caption saying what to look at. Mark sample data as "sample data".
- No gradients, glass effects, AI illustrations, large decorative icons or slide animations (one simple fade at most).
- At most one code-like formula on a slide (slide 8 or the whiteboard).

---

## 8. Screenshot checklist

Take these from the running app (`pnpm build && pnpm start`). Do not mock them up. Use a 1440 px wide window, light theme.

| # | Screen | URL / state | Used on |
|---|---|---|---|
| 1 | Plan a Trip, first step | `/plan`, Destination step filled with Prishtina → Barcelona | Slides 4–5 |
| 2 | Plan a Trip, Review step | `/plan`, step 7, all answers visible | Slide 5 |
| 3 | Validation errors | `/plan`, press Continue with an empty Destination step | Slide 14 (optional) |
| 4 | Unsupported destination | `/plan`, Review step with "Rome", error shown | Slide 15 (optional) |
| 5 | Trip workspace Overview | `/trips/barcelona/overview` | Slide 3 |
| 6 | Itinerary with map panel | `/trips/barcelona/itinerary` | Slide 10 |
| 7 | Hotels | `/trips/barcelona/hotels` | Slide 10 (caption: sample scores) |
| 8 | Activities | `/trips/barcelona/activities` | Optional |
| 9 | Budget | `/trips/barcelona/budget` | Slide 11 |
| 10 | Terminal: engine output | The command in `DEMO_SCRIPT.md` §5 | Slide 9 (optional) |
| 11 | Test run | `pnpm test` with a test database, "98 passed" | Slide 14 |
| 12 | Design system reference | `/design-system` | Optional, for design questions |

Not possible, because the feature does not exist: AI assistant, saved trips list, live map, flight results.
