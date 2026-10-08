# Demo script

The live demo for the presentation (slide 13 in [`PRESENTATION_PLAN.md`](PRESENTATION_PLAN.md)). Target length: 3 minutes, at most 4.

The flow below was run end to end against a production build on 2026-10-08. It needs **no database, no API keys and no internet connection** once the app is built.

---

## 1. What the demo can and cannot show

| Can show (works today) | Cannot show (does not exist yet) |
|---|---|
| The 7-step Plan a Trip form with validation | The engine filling the workspace |
| Generate My Trip opening the trip workspace | Any destination other than Barcelona |
| The workspace tabs with the Barcelona sample trip | A real map, routes or travel times from a provider |
| The budget calculation (planned, reserve, remaining) | Selecting a different hotel (the button does nothing yet) |
| The recommendation engine in a terminal (optional, §5) | AI assistant, flights, saved trips |

Say once, at the start of the workspace part: "From here, the workspace shows our Barcelona sample trip. Connecting the engine to it is our next step." Then demo without apologising again.

---

## 2. Preparation (the day before)

1. `pnpm install`
2. `pnpm build`. This needs internet once, because `next/font` downloads the Instrument Sans font at build time.
3. Check the build runs: `pnpm start`, then open http://localhost:3000/overview.
4. You do **not** need `.env.local` or PostgreSQL for this demo. The form and workspace do not touch the database.
5. Browser: a clean profile, 1440 px wide or larger, zoom 110–125% so the back row can read it, light theme, no extensions or notifications showing.
6. Open these backup tabs in the same window, in this order:
   `/trips/barcelona/overview` · `/trips/barcelona/itinerary` · `/trips/barcelona/hotels` · `/trips/barcelona/budget`
7. Keep the screenshots from the checklist (PRESENTATION_PLAN §8) in a folder, ready to show.
8. Optional terminal demo: run the §5 command once to check it works on the presentation laptop.

**Use dates in the future.** The form rejects a start date in the past. Use 12–17 July 2027. These are also the dates of the sample trip, so the workspace header will match what you typed.

---

## 3. Full demo (about 3 minutes)

| # | Action | Say | Time |
|---|---|---|---:|
| 1 | Open `/overview` | "This is Itinera. The overview shows the upcoming trip and a Plan a trip button." | 10 s |
| 2 | Click **Plan a trip** | "Planning starts with a seven-step brief." | 5 s |
| 3 | Destination step: Departure *Prishtina*, Destination *Barcelona*, Start *12 Jul 2027*, End *17 Jul 2027*. Click **Continue**. | "We ask for dates, not for the number of days. Days are calculated, so they can never contradict the dates." | 25 s |
| 4 | *(Optional, 10 s)* Before step 3, clear the Destination and click Continue to show the inline error, then type it back. | "Every step is validated. The server runs the same validation again." | 10 s |
| 5 | Travelers: Adults *2*, Children *0*. **Continue**. | "Party size later decides rooms and group-size limits." | 10 s |
| 6 | Budget: *1500*, EUR, style **Balanced**. **Continue**. | "The budget and the travel style set the hotel and activity allowances. With Balanced, 40% of the budget is the hotel envelope." | 15 s |
| 7 | Accommodation: **4 stars**. **Continue**. | "Star category is a preference, not a hard filter." | 5 s |
| 8 | Interests: **Architecture**, **Museums**, **Food & markets**. **Continue**. | "Interests feed the interest-match score." | 10 s |
| 9 | Preferences: keep Walking and Public transport. **Continue**. | — | 5 s |
| 10 | Review step: point at the summary, then **Generate My Trip**. | "The review shows every answer with an Edit link." | 10 s |
| 11 | Workspace **Overview** | "This opens the trip workspace. From here it shows our Barcelona sample trip." | 10 s |
| 12 | **Itinerary** tab | "A day is a timeline: start time, duration, travel leg between stops, booking status and the cost of the day. The numbers match the stops on the map." | 25 s |
| 13 | **Map** tab | "The map is a placeholder drawing for now. A MapLibre map and routing provider are planned." | 10 s |
| 14 | **Hotels** tab | "Each hotel shows a match score and reasons. These two are sample values. Our engine computes real ones, as on slide 9." | 15 s |
| 15 | **Budget** tab | "Planned spend, the 10% reserve and what remains: €66 of €1,500. Each line shows how it was estimated." | 20 s |
| | | **Total** | ~3 min |

End the demo on the Budget tab and go back to the slides.

---

## 4. Short demo (about 1 minute, for the 3–5 minute version)

1. `/plan` with the brief already filled in up to the Review step (fill it in before the talk and leave the tab open). 10 s
2. **Generate My Trip** → Overview. 10 s
3. **Itinerary** tab. 20 s
4. **Budget** tab. 20 s

---

## 5. Optional: the engine in a terminal (about 40 seconds)

This is the only way to show the recommendation engine running today. Use it if the jury asks "where is the intelligence?", or as a backup if the browser fails. Run it from the repository root:

```bash
npx tsx -e '
import { buildRecommendations } from "./src/server/engines/recommendation/index.ts";
const r = buildRecommendations({
  profile: { destination: "Barcelona", currency: "EUR", totalBudgetMinor: 150000, durationDays: 6,
    travelers: { adults: 2, children: 0 }, hotelPreference: { stars: 4 }, travelStyle: "balanced",
    selectedActivities: ["architecture", "museums"],
    transportationPreference: { modes: ["walk", "public-transit"] }, foodPreference: { diets: [], cuisines: [] } },
  hotels: [
    { id: "h1", name: "Hotel Casa Fuster", destination: "Barcelona", currency: "EUR", nightlyPriceMinor: 14200, stars: 4, type: "hotel", rating: 4.6, reviewCount: 2341, distanceToCenterMeters: 2100, nearbyActivityTags: ["architecture"], amenities: [] },
    { id: "h2", name: "Praktik Bakery", destination: "Barcelona", currency: "EUR", nightlyPriceMinor: 11800, stars: 3, type: "hotel", rating: 4.4, reviewCount: 1876, distanceToCenterMeters: 900, nearbyActivityTags: ["architecture"], amenities: [] } ],
  activities: [] });
for (const h of r.hotels) console.log(h.score, h.candidate.name, "|", h.breakdown.map(b => b.key + "=" + b.score).join(" "), "|", h.reasons.join(" "));
'
```

Expected output (checked on 2026-10-08):

```
88 Praktik Bakery | budgetMatch=100 preferenceMatch=82.5 locationMatch=100 activityMatch=50 ratingScore=88 foodMatch=100 | Within your accommodation budget at €118 per night. Well located for your preferred transportation mode. Near activities that match architecture.
78 Hotel Casa Fuster | budgetMatch=63.3 preferenceMatch=96 locationMatch=87.8 activityMatch=50 ratingScore=92 foodMatch=100 | Matches your 4-star hotel preference. Well located for your preferred transportation mode. Near activities that match architecture.
```

What to say: "Same brief as the demo. The 4-star hotel matches the star wish but costs €142 against a €120 allowance, so the cheaper 3-star ranks first. Run it again and you get exactly the same result, because the engine is deterministic."

Optional live change, to show the engine reacts: change `travelStyle: "balanced"` to `"comfort"`. The hotel share rises to 48% (€144 per night), Casa Fuster is now within budget, and the ranking flips: Casa Fuster 89, Praktik Bakery 87 (checked on 2026-10-08). This shows one input changing the recommendation, with a reason you can calculate by hand.

Hotel facts come from the development fixture. `type` and `nearbyActivityTags` were added for this example because the fixture does not carry them. Say so if asked.

---

## 6. Backup plan

| If… | Then… |
|---|---|
| `pnpm start` fails or the laptop has no Node | Show the screenshots in order (PRESENTATION_PLAN §8) and narrate the same steps. Say that you are showing screenshots. |
| The form rejects the start date | The date is in the past. Use 2027 dates. |
| Generate My Trip shows "Barcelona is the only destination…" | A different destination was typed. Correct it to Barcelona. If the jury asked for another city, this message is the honest answer: the catalog preview has one city. |
| The page is slow or blank after Generate | Use the pre-opened backup tabs (§2, step 6). The workspace pages do not depend on the form. |
| The jury asks to see the engine | Run §5 in a terminal, or show slide 9. |
| The jury asks to see the database or API | Do not improvise this live: it needs PostgreSQL and `.env.local`. Show the test run screenshot (98 passed) and the schema in `drizzle/0000_initial_schema.sql`. |
| No internet in the room | Nothing changes. The built app has no external calls. |

Do not show anything as working that is not: no prepared fake chat, no edited screenshots, no hardcoded "AI" output.

---

## 7. Demo risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| External APIs or API keys | None. The app calls no external service. | — |
| Font download during `pnpm build` | Only at build time | Build the day before with internet |
| Past start date rejected | High if you forget | Use 12–17 July 2027 |
| Another city typed | Medium, if the jury asks | Explain the one-city catalog preview |
| Jury notices the workspace dates and scores do not depend on the brief | Medium | Already said at step 11. Point to the limitations slide. |
| "Select hotel" or the day buttons on the Itinerary tab do nothing | Medium, if clicked | Do not click them. If asked: the interaction is not wired yet. |
| Opening `/trips/anything/overview` still shows Barcelona | Low | Do not type workspace URLs by hand. Listed in PRESENTATION_REVIEW_FINDINGS. |
