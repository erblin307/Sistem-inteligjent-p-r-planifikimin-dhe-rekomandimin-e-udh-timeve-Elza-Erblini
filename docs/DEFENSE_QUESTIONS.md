# Defense questions

Likely questions from the professor, assistant and jury, with answers based on the code as of 2026-10-08 (commit `66a00b8`). File references are there so you can open the code if asked.

Ground rules for answering:

- Start with the direct answer, then one supporting detail. Stop there unless they ask for more.
- When something is designed but not built, say "designed, not built yet" and name the section of `ARCHITECTURE.md`. Do not describe a design as if it runs.
- If you don't know, say what you would check and where.

Contents: §1 the 15 core questions · §2 technical deep-dive (10) · §3 hard and honesty questions (8). 33 questions in total.

---

## 1. Core questions

### 1. Why is this system considered intelligent?

Because it makes a reasoned choice for each traveler instead of showing a fixed list. The recommendation engine:

- removes options that cannot work (wrong city or currency, group size outside the activity's limits, a diet a food experience cannot serve),
- turns the brief into allowances (for example, a Balanced traveler's hotel allowance is 40% of the budget per night and room),
- scores every option on six criteria (budget, preferences, location, interests, rating, food),
- combines them with weights into a 0–100 match score and ranks the results,
- explains each result in up to three plain sentences.

It is content-based, multi-criteria decision making. It is not machine learning, and we don't claim it is. (`src/server/engines/recommendation/engine.ts`)

### 2. How are recommendations calculated?

Each component is scored from 0 to 100, then combined:

```
hotel    = 0.30·budget + 0.20·preference + 0.20·location + 0.15·interest + 0.10·rating + 0.05·food
activity = 0.25·budget + 0.15·preference + 0.20·location + 0.25·interest + 0.10·rating + 0.05·food
```

- **Budget**: 100 if the cost is within the allowance. Above it, minus 2 points per 1% over.
- **Preference (hotel)**: star match (50%), hotel type (30%) and how close the stars are to the travel style's target (20%).
- **Preference (activity)**: suits the travel style (70%) and fits within a day of 8 hours, or 6 for a one-day trip (30%).
- **Location**: if travel times exist, 100 within the walking limit (default 30 min) or 15 min, falling to 0 at 60 min. Otherwise by distance to the centre: 100 within 1 km, 0 at 10 km.
- **Interest**: share of the selected interests found in the candidate's tags.
- **Rating**: rating out of 5 scaled to 100, reduced by up to 15% when there are fewer than 1,000 reviews.
- **Food**: diet coverage (70%) and cuisine coverage (30%). 100 when there is no food preference.

Example: Casa Fuster scores 78 and Praktik Bakery 88 for a €1,500 Balanced trip (slide 9).

### 3. Why did you choose this algorithm?

- **Cold start.** There are no users or ratings history yet, so collaborative filtering or a learned model has nothing to learn from.
- **Explainability.** A weighted sum can be broken down into exactly what each criterion contributed. A learned ranker cannot be explained this simply.
- **Determinism.** No randomness, clock or network, so the same input gives the same ranking. That makes it testable and easy to debug.
- **Speed.** It runs in linear time in the number of candidates.

The trade-off: the weights are set by hand. The design leaves room to learn them later from user behaviour (`ARCHITECTURE.md` §2.3).

### 4. How do you ensure the itinerary stays within budget?

Honestly: there is no itinerary generator yet, so nothing assembles a full plan and checks its total. What exists today:

- The engine gives budget the largest weight (30% for hotels, 25% for activities), using allowances derived from the total budget and the travel style.
- The Budget tab computes planned spend, a 10% reserve and what remains, and shows a negative remaining in red (`src/components/travel/budget-breakdown.tsx`).

The budget engine that would allocate the budget and suggest cuts when a plan is infeasible is designed in `ARCHITECTURE.md` §10, not built.

### 5. How do you prevent duplicate activities?

There is no itinerary generator yet, so there is no duplicate check between days. What exists:

- Selected interests, transport modes and diets are de-duplicated when the brief is validated (`new Set` in `src/contracts/trip-brief.ts`, and in `src/contracts/trip.ts`).
- The database has unique keys: one row per trip and interest, one recommendation per itinerary, kind and rank, one item per position in a day, and at most one saved place per user and target.

The designed itinerary engine selects each activity at most once across the trip (`ARCHITECTURE.md` §9.2).

### 6. How does route optimisation work?

It is not built. The design (`ARCHITECTURE.md` §9.2) is: group the day's activities by area, then order them with a nearest-neighbour route improved by 2-opt, starting and ending at the hotel, with a straight-line (haversine) estimate when no routing provider is available.

What the engine does today with location: it prefers places reachable within the traveler's walking limit, or close to the centre, through the location score.

### 7. What happens if an external API fails?

There are no external APIs in the current system. No map, routing, hotel, places, weather or flight provider is called, so nothing can fail that way, and no API keys are needed.

For internal failures:

- Errors are returned as RFC 9457 `problem+json` with a stable code, such as `BRIEF_INVALID` or `DESTINATION_NOT_SUPPORTED`.
- An unexpected error returns a generic 500. The details go to the server log with a request id, never to the user (`src/server/platform/http.ts`).
- The form keeps everything the user typed and shows the error message, so they can try again.

The planned rule for providers is "degrade, don't fail": for example, use straight-line estimates if routing fails (`ARCHITECTURE.md` §12.3).

### 8. Where is user data stored?

- **Trips API**: PostgreSQL 16, through Drizzle ORM. Each trip has a `user_id`, and every query filters by it.
- **Plan a Trip form**: only in the browser's memory while the user fills it in. It is not saved yet, and a page reload clears it.
- **Workspace**: reads a static sample file, not user data.
- Nothing is stored in localStorage or cookies by the app.

### 9. Why did you choose this technology stack?

| Choice | Reason |
|---|---|
| Next.js (App Router) + React | One project for the interface and the API. Server components load data without an extra HTTP call. |
| TypeScript, strict | The domain has many shapes (brief, candidates, plans). Errors are caught at compile time. |
| PostgreSQL | Relational data with real integrity: foreign keys, CHECK constraints, unique keys, arrays, partial indexes. |
| Drizzle ORM | Schema written as code close to SQL, generated migrations, no heavy runtime. |
| Zod | One schema validates input and produces the TypeScript type. |
| Tailwind + shadcn/ui | Accessible Radix components, restyled with our own tokens. |
| Vitest | Fast, TypeScript-native tests. |

### 10. What is the difference between your assistant and a normal chatbot?

The project has no AI assistant or chatbot. We decided not to present one.

What plays the "explaining" role instead is built into the engine: each recommendation comes with its score breakdown and up to three sentences such as "Within your accommodation budget at €118 per night." These come from the actual numbers, not from generated text, so they cannot invent facts.

### 11. How does the system handle incorrect input?

Validation happens in three layers:

1. **Form**: each step is validated before Continue. Errors appear next to the field, and focus moves to the step title.
2. **Server**: the same `validateTripBrief` runs again on the API. Body over 64 KB → 413, invalid JSON → 400, invalid brief → 422 with an error per field.
3. **Database**: CHECK constraints, for example end date ≥ start date, at most 10 travelers, rating 0–5, latitude −90 to 90.

Examples of rules: start date not in the past, end date not before start, at most 21 days, at least 1 adult, at most 10 travelers, budget above 0, at least one interest and one transport mode, text at most 120 characters. A destination other than Barcelona gets a clear message.

### 12. What are the project's biggest limitations?

1. The engine is not yet connected to the interface. The workspace shows a sample trip.
2. Only one destination, with illustrative catalog data.
3. Itinerary, budget and routing engines are designed, not built. The map is a placeholder.
4. No sign-in. The trips API uses a development user.
5. Weights are set by hand, and the engine has no automated tests yet.

### 13. How would you scale this to production?

Following `ARCHITECTURE.md` §5.3 and §11:

- The app is stateless, so more instances can run behind a load balancer (Vercel or containers).
- Managed PostgreSQL with connection pooling.
- Plan generation moves to a background worker (`pg-boss`) behind the same API contract once it gets slow.
- Provider responses are cached with a time limit, behind circuit breakers and rate limits.
- The engine is a pure function, so it is cheap to run and needs no shared state.

The first steps, though, are functional: real sign-in, connecting the engine, and a real catalog.

### 14. What would you improve with more time?

1. Connect the engine to the Hotels and Activities tabs, and save the results.
2. Write unit and golden tests for the engine.
3. Build the itinerary engine (grouping, ordering, scheduling).
4. Build the budget engine with feasibility suggestions.
5. A real map and routing provider.
6. Sign-in and saved trips.
7. More cities, and tuning the weights from user feedback.

### 15. Which part was technically most challenging?

Pick one you can talk about in depth. Good candidates:

- **The hotel and activity dependency.** The best hotel depends on where the activities are, and the affordable activities depend on what the hotel costs. The design solves it with a budget envelope first and a reconciliation pass at the end (`ARCHITECTURE.md` §5.2). Today, travel-style budget shares stand in for the envelope.
- **Explainable, deterministic scoring.** Clamping every component to 0–100, rounding and stable tie-breaking by id so the same input always gives the same order.
- **Dates and time zones.** "Not in the past" is checked against today *at the destination* (`localDate` in `src/server/modules/trips/service.ts`), and dates are stored as plain dates so they never shift with the server's time zone.
- **Data integrity.** Rules enforced twice, in Zod and in PostgreSQL CHECK constraints, tested with 27 database tests.

---

## 2. Technical deep-dive

### How is state shared between modules?

On the server, modules talk only through their service functions, never each other's repositories. The engine receives plain data and returns plain data. In the browser, the form keeps its state in React (`useState`), and the workspace tabs are separate routes that read the same sample module. There is no global client store.

### How is trip isolation maintained?

Every trip row has `user_id`, and every repository function takes the owner id and filters by it. Another user's trip, or a malformed id, answers **404, not 403**, so the API never reveals that a trip exists. This is tested in `tests/api/api.test.ts` ("answers 404 for other users' trips and malformed ids") and `tests/db/schema.test.ts` ("hides trips from other users").

Caveat: the workspace pages at `/trips/[tripId]` do not check the id yet. They show the sample trip for any id.

### How do you normalise external provider data?

No provider is integrated yet. Inside the engine, text is normalised before comparing: trimmed and lower-cased (`normalise`), and currencies compared in upper case. The catalog tables have `source` and `external_id`, with a unique pair, so one provider record maps to one row. The adapter design (validate with Zod, map to catalog types, cache) is in `ARCHITECTURE.md` §11.

### How do you calculate budget totals?

All money is integer minor units (cents) plus a currency code, so there are no floating-point errors. On the Budget tab: planned = sum of all lines except Reserve, committed = planned + reserve, remaining = total − committed. In the engine: hotel cost = nightly price × nights × rooms, where nights = days − 1 and rooms = ⌈travelers ÷ room capacity⌉ (2 by default).

### How do you validate coordinates?

Departure coordinates in the trips API must be between −90 and 90 (latitude) and −180 and 180 (longitude) (`src/contracts/trip.ts`). The database repeats the same ranges as CHECK constraints on destinations, hotels and activities (`src/server/db/schema/catalog.ts`).

### How do you handle stale derived data?

By not storing it. Days, nights, the number of children and remaining budget are calculated when read, so they cannot go stale. Where a value must be frozen, it is a deliberate snapshot: a plan stores the price that was used in each recommendation, so an old plan stays explainable after prices change.

### How does persistence survive reload?

For the trips API, the data is in PostgreSQL, so it survives anything. The Plan a Trip form does not persist yet: a reload clears it. Autosaved drafts are part of the design.

### How does the engine validate its input?

Before scoring, it rejects impossible input with a `RangeError`: a non-positive budget, fewer than 1 day or 1 adult, no transport mode, a rating outside 0–5, a negative price or distance, a star rating outside 1–5, a group-size minimum above the maximum. Bad data fails loudly instead of producing a misleading score.

### Why integer minor units for money?

`0.1 + 0.2 ≠ 0.3` in floating point. Integers (150000 = €1,500.00) add exactly. The database also stores a currency code, and the engine refuses to compare a hotel priced in a different currency.

### How do you keep the design consistent?

The Tailwind theme is reset, so only our tokens exist. `pnpm lint:tokens` rejects arbitrary colours, spacing, gradients, blur and heavy font weights (`scripts/check-design-tokens.mjs`). The live reference is the `/design-system` page.

---

## 3. Hard and honesty questions

### "The Hotels tab shows Casa Fuster at 92. Your engine says 78. Which is true?"

The engine's 78 is the computed value for that brief. The 92 is a sample value typed into the fixture to design the screen. Connecting the engine to the tab is the first item under future work.

### "Does Generate My Trip actually generate anything?"

Not yet. It validates the brief on the server, checks the destination is in the catalog preview, and opens the Barcelona workspace. Generation will plug in at that same endpoint.

### "Why does Casa Batlló get 0 for budget?"

For €1,500, 6 days, 2 people and Balanced style, the daily activity allowance is €1,500 × 18% ÷ 6 ÷ 2 = €22.50 per person. Casa Batlló costs €35, 56% over, and the penalty is 2 points per 1%, so it bottoms out at 0. It still scores 61 overall because of location, interest and rating. The steep slope is a design choice we would revisit with real usage data.

### "Why does an architecture site only get 50 for interest match?"

Interest match is the share of *your* interests the place covers. With architecture and museums selected, an architecture-only site covers half. It is a simple, explainable measure. Its weakness is that selecting more interests lowers every single-topic place.

### "Is this AI?"

It is a rule-based, multi-criteria recommendation system: explainable scoring and ranking, not a neural network or a language model. We use "intelligent" in the sense of making personalised, reasoned decisions from constraints.

### "Did you use AI tools to build it?"

Answer truthfully about your own process. The repository history shows commits made with AI coding assistants. A good answer explains what you decided and checked yourselves: the scoring design, the data model, reviewing and testing the code.

### "Why only Barcelona?"

The catalog preview has one city so the data could be checked by hand. The model supports many destinations (`destinations` table, `source` and `external_id`), and the trips API already accepts any active destination in the database.

### "What exactly is tested, and what isn't?"

Tested (98 tests): trip contracts, database constraints and cascades, owner isolation, API status codes and error shapes. Not tested yet: the recommendation engine, the form's validation function (`trip-brief.ts`), and the interface. No end-to-end tests yet.
