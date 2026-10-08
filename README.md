# Itinera: intelligent travel planning

Next.js (App Router) · TypeScript strict · Tailwind CSS v4 · shadcn/ui on Radix.

- Architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Design system: [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md). The live reference is at `/design-system`.
- Recommendation engine: [`docs/RECOMMENDATION_ENGINE.md`](docs/RECOMMENDATION_ENGINE.md)
- Presentation and defense: [`docs/PRESENTATION_PLAN.md`](docs/PRESENTATION_PLAN.md), [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md), [`docs/DEFENSE_QUESTIONS.md`](docs/DEFENSE_QUESTIONS.md)

```bash
pnpm install
pnpm dev            # http://localhost:3000/design-system
pnpm lint           # ESLint
pnpm lint:tokens    # design-token guard
pnpm typecheck
pnpm build
```

## API

REST under `/api/v1`. Errors are `application/problem+json`. See `docs/ARCHITECTURE.md` §7.

```bash
curl "localhost:3000/api/v1/destinations?interest=architecture&minStars=4"
curl -X POST localhost:3000/api/v1/trips -H 'content-type: application/json' -d '{
  "destinationId": "<id>", "startDate": "2027-07-12", "days": 6, "adults": 2,
  "budgetMinor": 150000, "currency": "EUR", "travelStyle": "balanced",
  "localTransportModes": ["walk"], "interests": ["architecture", "food"]
}'
```

Trip endpoints need a user. Until sign-in exists, set `DEV_AUTH_EMAIL` in `.env.local`. It is ignored in production.

## Database

PostgreSQL 16+ with Drizzle ORM. Copy `.env.example` to `.env.local` and set `DATABASE_URL`.

```bash
pnpm db:migrate     # apply migrations in drizzle/
pnpm db:seed        # reference data + development fixtures (source = "fixture")
pnpm db:generate    # create a migration after changing src/server/db/schema
pnpm db:check       # verify migration history is consistent
TEST_DATABASE_URL=postgres://…/itinera_test pnpm test   # integration tests (database name must end in _test)
```
