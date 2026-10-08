# AI handoff

Shared notes for whichever agent (Claude or Codex) works on this repository next.
Keep it short; replace sections rather than appending history.

## Completed (Prompt 1–6 audit, 2026-10-08)

- Audited the app against Prompts 1–6. Full report: `/mnt/project-files/audit/AUDIT_REPORT.md` in the project workspace (not in the repo).
- Theme switch in the product: a toggle in the app shell (sidebar, rail, mobile top bar) and on the landing page. The choice persists in `localStorage` (`itinera-theme`), falls back to the OS preference, and is applied before first paint.
- Trip form: pressing Enter on a step with one text field (Budget) now acts as Continue instead of submitting and skipping steps.
- Trip workspace: any trip ID other than `barcelona` returns a 404 ("Trip not found") instead of showing Barcelona.
- Trip workspace header says it shows sample data, because the form's brief is not used by the workspace.

## Files changed

- `src/lib/theme.ts`, `src/lib/theme-script.ts`, `src/components/theme/theme-toggle.tsx` (new; replaces the design-system-only toggle)
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/components/shell/app-shell.tsx`, `src/app/design-system/*`
- `src/components/travel/trip-planner.tsx`, `src/components/travel/trip-header.tsx`
- `src/app/(app)/trips/[tripId]/layout.tsx`, `src/app/(app)/trips/not-found.tsx`
- `src/contracts/trip.ts` (comment only)

## Important decisions

- Theme state lives in one place (`src/lib/theme.ts`). Do not add per-component light/dark variants; use the tokens in `globals.css`.
- `theme-script.ts` has no `"use client"` so the server layout receives the script string.
- No integration work was done. The fixes are the smallest that stop the UI from misreporting data.

## Known issues

- Two parallel trip paths: the form posts `src/contracts/trip-brief.ts` to `/api/v1/trips/generate`, which saves nothing and always redirects to the Barcelona fixture. The real, tested path is `src/contracts/trip.ts` → `POST /api/v1/trips` (Postgres). Their enums differ (`public-transit` vs `public_transport`, interest slugs, no `pace` in the form).
- All workspace tabs read `src/lib/fixtures/barcelona.ts`. The recommendation engine (`src/server/engines/recommendation`) is not called anywhere and has no tests. There is no itinerary generator.
- The map is a static SVG with fixed marker positions. Day buttons on the itinerary tab do nothing.
- No images anywhere: `ImageFrame` always shows its placeholder.

## Recommended next step

Point the plan form at `POST /api/v1/trips` (map the brief onto `createTripInput`, add a destination picker from `/api/v1/destinations`), then load `/trips/[tripId]` from `GET /api/v1/trips/:id` and delete `/api/v1/trips/generate` and `trip-brief.ts` once nothing uses them.
