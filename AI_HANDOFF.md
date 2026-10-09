# AI handoff

Shared notes for whichever agent (Claude or Codex) works on this repository next.
Keep it short; replace sections rather than appending history.

## Completed (2026-10-08)

**Prompt 1–6 audit fixes.** Theme toggle in the app shell and landing page (persisted, OS default, no flash). Enter on a single-field form step acts as Continue. Unknown trip IDs return 404. Full audit report: `/mnt/project-files/audit/AUDIT_REPORT.md` in the project workspace (not in the repo).

**Claude and Codex trip paths joined into one.**

```
/plan (form)  →  POST /api/v1/trips  →  PostgreSQL  →  /trips/<uuid>/*
                                                      ├ Overview: the saved brief
                                                      ├ Hotels, Activities: recommendation engine over the destination catalog
                                                      └ Itinerary, Map, Budget: empty state (no engine yet)
```

- One trip contract: `src/contracts/trip.ts`. The form maps onto it in `src/lib/trip-form.ts` (pure, unit-tested). Removed: `src/contracts/trip-brief.ts`, `/api/v1/trips/generate`, `src/server/modules/trips/create-trip.ts`.
- The form loads destinations and interests from the database (`/plan` server page). It gained pace, accommodation type and children's ages, which the contract already had. Cuisine tastes were dropped: the database has nowhere to store them.
- The engine's vocabularies now come from the contract. Star preference is a minimum. Unclassified properties (`stars = null`) are scored.
- `src/server/modules/recommendations` maps a saved trip and its catalog onto the engine; also served at `GET /api/v1/trips/:id/recommendations`.
- `/trips` and `/overview` list the user's saved trips. `/trips/barcelona` stays as a labelled sample.

**Prompt 18: travel media foundation (2026-10-09).** One image path: provider adapter → `normalizeTravelImage` → `TravelImage` → `ImageFrame`. Model in `src/contracts/media.ts`; pure policy, normalisation, selection and credits in `src/lib/media`; provider port and `findImage` in `src/server/integrations/media` (no adapter registered). `ImageFrame` takes `image: TravelImage`, has typed fallbacks, error handling and credits (`MediaCredit`). Recommendation and destination responses return `image` instead of `imageUrl`. Rules: `docs/MEDIA.md`.

## Important decisions

- Saved-trip pages load data through `src/app/(app)/trips/data.ts` (`loadWorkspace`, `loadRecommendations`, `loadMyTrips`), cached per request. Use it instead of importing the fixture.
- `currentUser(db)` in `src/server/platform/auth.ts` is the Server Component counterpart of `requireUser`. Both only know `DEV_AUTH_EMAIL`, which is ignored when `NODE_ENV=production`, so `next start` cannot create trips until sign-in exists. Use `pnpm dev`.
- The development catalog is `source = "fixture"`; pages that show it say so (`CatalogNote`).
- Images: never pass a bare URL to a component, never call an image provider from a component, never show stock imagery next to a named hotel, place or flight. Add a provider as one `ImageProvider` adapter plus its terms in `docs/MEDIA.md` §4.
- Theme state lives in `src/lib/theme.ts`; the bootstrap string is in `src/lib/theme-script.ts` (no `"use client"`).

## Known issues

- No itinerary generator, budget engine or real map (Prompts 4–5). Their tabs show an empty state for saved trips.
- Choosing a hotel or adding an activity is not saved; those buttons are hidden for saved trips.
- No images: no image provider is integrated and the catalog has none, so every `ImageFrame` shows its neutral fallback. `image_url` columns are read only for same-origin files (they carry no source or licence).
- The catalog has no travel times or dietary data, so location is straight-line distance and food experiences are excluded when a dietary requirement is set.
- `docs/DEMO_SCRIPT.md` and `docs/DEFENSE_QUESTIONS.md` still describe the old `/generate` flow.

## Recommended next step

Build the itinerary generator as `src/server/engines/itinerary` that takes the saved trip plus the ranked activities from `recommendForTrip`, distributes them over the days by pace and opening hours, and stores the result in the existing `itineraries` tables. The Itinerary, Map and Budget tabs can then read it.

For images, the next step is the Google Places Photos adapter (`src/server/integrations/media`). It needs `GOOGLE_PLACES_API_KEY` on the server and a Google place ID per activity; the fixture catalog has none, so the adapter must resolve them (Text Search) or the catalog must store them.

## Local setup

`.env.local` with `DATABASE_URL` and `DEV_AUTH_EMAIL`, then `pnpm db:migrate`, `pnpm db:seed`, `pnpm dev`. Tests: `TEST_DATABASE_URL=postgres://…/itinera_test pnpm test`.
