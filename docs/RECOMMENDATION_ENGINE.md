# Recommendation engine

The recommendation engine is a pure function in
`src/server/engines/recommendation`. It has no network access, database access,
clock or random source. The same profile and catalog snapshot always return the
same scores and ordering.

## Inputs

The trip profile contains the destination, total budget and currency, trip
duration, travelers, hotel preference, travel style, selected activities,
transportation preference and food preference. Hotel and activity candidates
carry the real catalog facts used by the score: prices, rating and review count,
location/travel times, tags, capacity and supported food options.

Money is expressed as integer minor units. For example, `150000` with currency
`EUR` means €1,500. This prevents floating-point rounding errors.

## Eligibility

A destination or currency mismatch receives a score of 0. Activities also
receive 0 when their group-size limits cannot accommodate the travelers. A food
experience that cannot satisfy a required diet is ineligible instead of merely
receiving a small penalty.

## Hotel formula

| Component | Weight | Derived from |
|---|---:|---|
| Budget match | 30% | Nightly price, nights, required rooms and either the explicit nightly limit or the style-based accommodation envelope |
| Preference match | 20% | Requested stars, hotel type and the star level associated with the travel style |
| Location match | 20% | Real travel time for preferred modes, maximum walking time, or distance to the center as a fallback |
| Activity match | 15% | Overlap between selected activities and nearby activity tags |
| Rating score | 10% | Rating from 0–5, moderated by the real review count |
| Food match | 5% | Supported diets and cuisine tags |

## Activity formula

| Component | Weight | Derived from |
|---|---:|---|
| Budget match | 25% | Per-person price and the daily activity allowance derived from budget, duration, travelers and travel style |
| Preference match | 15% | Suitable travel styles and whether the duration fits a realistic day |
| Location match | 20% | Travel time for preferred modes, maximum walking time, or center distance |
| Activity match | 25% | Candidate id, name and tags compared with selected activities |
| Rating score | 10% | Rating from 0–5, moderated by review count |
| Food match | 5% | Diet and cuisine compatibility for food experiences; neutral for other activities |

Every component is clamped to 0–100. The final score is the weighted sum,
rounded to an integer and clamped again to 0–100. Ties are ordered by candidate
id, so ordering stays deterministic.

## Explainability

Each result includes the full component breakdown and up to three concise
reasons based on the strongest real matches, for example:

> Within your accommodation budget at €125 per night.
>
> Matches your 4-star hotel preference.
>
> Well located for your preferred transportation mode.

Call `buildRecommendations(input)` to score and rank all hotel and activity
candidates, or call `scoreHotel(profile, hotel)` / `scoreActivity(profile,
activity)` for one candidate.
