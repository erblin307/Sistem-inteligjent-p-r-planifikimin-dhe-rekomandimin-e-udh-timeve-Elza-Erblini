# Travel media

How images enter and render in Itinera. Every travel photo comes through one
path, so source, licence and credit are never lost and no component talks to
an image provider directly.

Status (2026-10-09): the foundation is built. **No live image provider is
integrated.** The catalog has no images, so every frame shows its neutral
fallback.

## 1. Path

```
Provider API (server, keyed)
  → adapter            src/server/integrations/media   (one per provider, implements ImageProvider)
  → normalizeTravelImage  src/lib/media/normalize.ts   (validates; invalid → null)
  → selectImage           src/lib/media/select.ts      (slot hierarchy, entity check)
  → TravelImage           src/contracts/media.ts       (API responses carry this)
  → ImageFrame + MediaCredit  src/components/travel    (the only renderers)
```

- `findImage(query)` in `src/server/integrations/media` is the single entry
  point for services. It asks providers in the slot's order, skips any that
  are unconfigured or fail, and returns `null` when nothing is usable. The
  provider registry is empty today, so it always returns `null`.
- The catalog's `image_url` columns are read through `catalogImage()`. They
  store no source or licence, so only files served by this app (`/…` paths)
  are accepted, as `local`. An external URL in that column is ignored.
- API responses (`/api/v1/trips/:id/recommendations`, `/api/v1/destinations`)
  return `image: TravelImage | null`, not `imageUrl`.

## 2. The model

`TravelImage` (`src/contracts/media.ts`):

| Field | Meaning |
|---|---|
| `url` | Display rendition (about 1200px wide at most). Never the original upload. |
| `thumbnailUrl` | Small rendition (about 400px) for list thumbnails. |
| `alt` | What the photo shows ("Colosseum in Rome"). Empty only when decorative. |
| `width`, `height` | Both or neither. |
| `source` | `booking` · `expedia` · `google_places` · `wikimedia` · `pexels` · `unsplash` · `local` |
| `subject` | `entity`: this specific hotel or place. `context`: destination or travel in general. |
| `attribution` | Author, source page, licence and their URLs, as the source gives them. |
| `metadata` | `placeId`, `propertyId`, `providerPhotoId`. |

`normalizeTravelImage` returns `null` (fallback) when:

- the source key is unknown (there is no key for scraped images)
- the source may not show that subject (stock imagery as an `entity`)
- the URL is not https on the source's allowed hosts, or not a same-origin
  path for sources served through the app; `data:`, `javascript:`,
  credentials, ports and lookalike hosts are refused
- a licence is required (Wikimedia) and missing
- the alt text is meaningless ("image", "IMG_2041.jpg")

Unsafe attribution links are dropped and the credit text is kept. An invalid
thumbnail is dropped and the main image is kept.

## 3. Integrity rules

A photo never implies it shows a specific hotel, place or flight unless it
does.

| Slot | Accepts (in order) | Subject | When nothing fits |
|---|---|---|---|
| `accommodation` | Booking.com → Expedia → local | entity | Neutral accommodation fallback |
| `place` | Google Places → Wikimedia → local | entity | Neutral place fallback |
| `destination` | Pexels → Unsplash → Wikimedia → local | context | Neutral destination fallback |
| `transport` | Pexels → Unsplash → local | context | No image (flights show airline, route, times, price) |

- `selectImage` rejects a provider photo whose `placeId` / `propertyId`
  belongs to another entity.
- Stock imagery is for context only: "Explore Rome" with a Pexels city
  photo is fine; "Hotel Artemide" or "Colosseum" with one is not.
- A missing or failed entity photo is never replaced by another photo.
- Google Places Photos (the Places API, with its terms) is allowed. Google
  Images results, blogs, Pinterest and hotel websites are not sources and
  can never be: there is no source key for them and their hosts are not
  allow-listed.

Sources and their hosts live in `src/lib/media/sources.ts`.

## 4. Providers (planned, not integrated)

All calls are server-side. No image key is ever sent to the browser, so none
gets a `NEXT_PUBLIC_` name. Variable names below are proposals for the
integration phases; nothing is in `.env.example` yet.

| Source | Use | Access | Proposed env | Credit | Notes to verify at integration |
|---|---|---|---|---|---|
| Google Places (New) Place Photos | Landmarks, museums, attractions, restaurants, parks | Server; key never leaves it. The browser gets a same-origin proxy path or the short-lived photo URI | `GOOGLE_PLACES_API_KEY` | Required: each photo's author attributions | Photo names expire and must not be cached; place IDs may be stored |
| Wikimedia Commons | Historical and cultural places; fallback after Google | Server (MediaWiki API, no key; descriptive User-Agent) | — | Required: author, Commons, licence in full | Licence from `extmetadata`; skip files without one |
| Pexels | Destination and transport context | Server | `PEXELS_API_KEY` | Required: photographer and Pexels | Context only |
| Unsplash | Alternative to Pexels | Server | `UNSPLASH_ACCESS_KEY` | Required: photographer and Unsplash, links with UTM | Hotlink their URLs; call the download endpoint on use |
| Booking.com Demand API | Property photos | Server | `BOOKING_DEMAND_API_KEY` (partner credentials) | Per partner terms | Only with real partner access |
| Expedia Rapid | Alternative property photos | Server (signed requests) | `EXPEDIA_RAPID_API_KEY`, `EXPEDIA_RAPID_SECRET` | Per partner terms | Only with real partner access |

Adding a provider means: one adapter implementing `ImageProvider`, one entry
in the registry, confirming the hosts in `sources.ts`, reading its display,
attribution and caching terms, and recording them here.

**Caching.** Nothing about images is cached yet. The generic `places 7 days`
TTL in `docs/ARCHITECTURE.md` §11 does not apply to photos: each provider's
cache rule is set from its terms when it is integrated.

## 5. Rendering

`ImageFrame` (`src/components/travel/image-frame.tsx`) is the only image
component. There are no provider-specific image components.

| Prop | |
|---|---|
| `image` | `TravelImage \| null`. Never a bare URL. |
| `ratio` | `16/9` destination hero · `4/3` hotel and place cards · `3/2` saved-trip preview · `1/1` only if needed |
| `size` | `thumbnail` (uses `thumbnailUrl`, no caption) · `card` · `hero` |
| `fallback` | `accommodation` · `place` · `destination` · `transport` · `generic` (icon on the muted surface) |
| `priority` | Eager loading, only for a hero visible on first paint |

- The ratio box reserves space, so cards do not shift when the photo loads.
  The static `muted` surface is the loading state (no shimmer).
- `object-cover`, never stretched. `loading="lazy"` and `decoding="async"`.
- A load error shows the fallback once and is not retried. Errors that
  happen before hydration are caught too.
- With no image the fallback is decorative (`aria-hidden`): the card's text
  already names the hotel or place. After a load error it announces
  "*alt* (photo unavailable)".
- Card and hero sizes caption the credit under the photo (`MediaCredit`,
  `type-caption`, muted). Thumbnails move it into the item's details, as
  `ActivityRow` does. A required credit is moved, never dropped; it is never
  an overlay on the photo.
- Plain `<img>` rather than `next/image`: the provider hosts are not live,
  and Google photo URIs are short-lived. Revisit with `remotePatterns` once a
  provider is integrated.
- All colours come from tokens, so frames, fallbacks and credits follow the
  light and dark themes.

## 6. Where images belong

| Screen | Use |
|---|---|
| Plan form | None. |
| Trip workspace header / overview | Optional 16:9 destination context photo. |
| Itinerary | Small place thumbnails at most; not on every row. |
| Hotels | The property's own photo (4:3). Important for the decision. |
| Activities / places | The place's own photo, thumbnail with credit in the row. |
| Map | No photos in markers. |
| Saved trips | Optional 3:2 destination thumbnail. |
| Flights | No photos; airline, route, times and price. |
