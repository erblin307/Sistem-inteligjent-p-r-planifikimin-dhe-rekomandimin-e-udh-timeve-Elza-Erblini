# Itinera design system

The live reference is the `/design-system` route (`pnpm dev`, then open
http://localhost:3000/design-system). `/design-system/preview` shows the
system assembled into the trip workspace inside the app shell.

This file records the rules and the reasoning behind them. Tokens live in
`src/app/globals.css`. Components live in `src/components/ui` (shadcn/ui
primitives restyled through tokens) and `src/components/travel` (product
patterns).

## Character

Clean, restrained, editorial, travel-focused. Photography, place names and
prices carry the interface. The chrome stays neutral. When in doubt, remove.

Release test for every screen: *would this look credible if a real travel
software company shipped it?* If not, simplify.

## Enforcement

The Tailwind theme is reset. Only the tokens below exist, so `text-blue-500`,
`rounded-2xl`, `shadow-lg`, `p-3` or `font-bold` generate no CSS.
`pnpm lint:tokens` (`scripts/check-design-tokens.mjs`) catches the remaining
escape hatches:

- arbitrary spacing, colour, font size or radius values
- any shadow other than `shadow-overlay`
- gradients
- backdrop blur (glass effects)
- font weights above 600

Arbitrary values are still allowed for layout geometry such as grid
templates, aspect ratios and calc positions.

## Colour

| Token | Light | Role |
|---|---|---|
| `background` | `#F6F6F3` | App canvas |
| `surface` / `card` | `#FFFFFF` | Cards, panels, inputs |
| `surface-subtle` | `#FAFAF8` | Table headers, selected rows |
| `muted` | `#EFEFEB` | Placeholders, meter tracks, active nav |
| `border` | `#E3E3DE` | Hairlines |
| `border-strong` / `input` | `#CFCFC9` | Input borders, strong dividers |
| `foreground` | `#17191C` | Primary text |
| `muted-foreground` | `#5C6066` | Secondary text (6.3:1 on white) |
| `subtle-foreground` | `#7E838A` | Meta icons and placeholders only (3.8:1). Never body copy. |
| `primary` (Harbour) | `#1D5A72` | **The only accent.** Primary action, selection, focus, current step (7.6:1 on white). |
| `primary-subtle` | `#E8F0F3` | Selected chips and rows, Recommended badge |
| `success` / `warning` / `destructive` | `#2C6A3F` / `#8A5A00` / `#B42318` | Status only, always with a word or icon |

Dark values are defined under `.dark` and documented live on the reference page.

Not allowed: secondary brand colours, gradients, neon, glassmorphism, and
colour-coded categories. Budget categories and interests are neutral.

## Typography

Instrument Sans (via `next/font`). It was picked over Schibsted Grotesk
because Schibsted's tabular figures widen commas and colons (`€1 , 500`,
`09 : 00`). Use a role, not raw size and weight:

| Role | Spec | Use |
|---|---|---|
| `type-title` | 24/32 · 600 · −1% | One per page: page or trip name |
| `type-heading` | 18/28 · 600 | Page sections, dialog titles |
| `type-subheading` | 16/24 · 600 | Card titles, day headings |
| `type-figure` | 20/28 · 600 · tabular | Prices and totals |
| `type-reading` | 16/24 · 400 | Longer descriptive text |
| `type-label` | 14/20 · 500 | Labels, buttons, item titles |
| `type-body` | 14/20 · 400 | Default UI text |
| `type-caption` | 12/16 · 400 | Hints, secondary figures |
| `type-overline` | 12/16 · 500 · caps | Table headers, menu group labels only |

The largest size in the product is 24px. Titles use sentence case. Every
price, time and duration uses `tabular`.

## Spacing

The base unit is 8px, with a 4px half-step. Padding, margin and gap use only
`1 2 4 6 8 12 16` (4, 8, 16, 24, 32, 48 and 64px). The keys `5 10 14 20+`
exist for sizing icons, controls, media and columns.

| Context | Mobile | Tablet | Desktop |
|---|---|---|---|
| Page gutter | 16 | 24 | 32 |
| Card padding | 16 | 24 | 24 |
| Between fields | 16 | 16 | 16 |
| Between blocks in a section | 32 | 32 | 32 |
| Between sections | 48 | 48 | 48 |

Control heights are 32, 40 and 48.

## Shape and elevation

- Radius: `sm` 4 (badges, checkboxes, thumbnails), `md` 8 (inputs, buttons,
  chips, menus), `lg` 12 (cards, dialogs, image frames), `full` (avatars and
  map markers only).
- A card marks a self-contained *object*, such as a hotel or a summary
  panel. Page sections are not cards: separate them with spacing, a heading
  and a hairline.
- Only `shadow-overlay` exists, used for menus, popovers, dialogs and the
  floating map card.

## Responsive layouts

These are three separate layouts, not one layout scaled down.

| | Mobile < 768 | Tablet 768–1279 | Desktop ≥ 1280 |
|---|---|---|---|
| Navigation | Top bar + bottom tab bar | 64px icon rail | 240px sidebar |
| Workspace tabs | Scrollable underline bar | Underline bar | Underline bar |
| Itinerary | List; Map button opens full-screen map | List; map in bottom panel | 60/40 list and sticky map |
| Hotel card | Image on top, price as footer row | Horizontal | Horizontal, price column |
| Dialogs | Bottom sheet | Centred, 480px | Centred, 480px |
| Plan form | "Step n of 5", sticky footer | Vertical stepper | Vertical stepper |

Only two breakpoints exist (`md`, `xl`), which forces exactly these three
decisions.

## Component inventory

**Primitives** (`src/components/ui`)
- Button (`primary` · `secondary` · `ghost` · `link` · `destructive`; sizes `sm` · `md` · `lg` · `icon`)
- Input, InputGroup, Textarea, Label, Field, Fieldset
- Select, Checkbox, RadioGroup + RadioOption, Switch, ChoiceChip
- Badge, Card, Separator
- Tabs (`underline` · `segmented`; the styles are in `tabs-styles.ts` for route-based tabs)
- Dialog (a bottom sheet on mobile), DropdownMenu, Tooltip
- Table, Meter, Stepper, Skeleton, Avatar

**Travel patterns** (`src/components/travel`)
- TripHeader
- ItineraryTimeline (time · rail marker · activity, location, duration · cost; travel legs between stops)
- HotelCard
- ActivityRow
- BudgetSummary + BudgetTable
- MapMarker + HotelMarker
- Rating + HotelStars
- Price
- MetaList
- ImageFrame + MediaCredit (takes a normalised `TravelImage`, never a bare URL; rules in `docs/MEDIA.md`)
- PageHeader + SectionHeader
- EmptyState

**Shell** (`src/components/shell`): AppShell (sidebar, rail or bottom bar) and PageContainer.

## Writing

- Buttons: verb + object ("Select hotel", "Add to day", "Regenerate plan").
- Errors: say what is wrong and how to fix it ("€300 is below the €600
  minimum for 2 travelers over 5 nights in Barcelona. Increase the budget or
  shorten the trip.").
- Recommendations: plain reasons ("Within your nightly budget · 12 min to 4
  of your activities"). Never "AI-powered" and no sparkle icons.
- Empty states: say what is missing and give the next step. No
  illustrations, no jokes.

## Icons

Lucide icons at stroke 1.75: 16px in controls and metadata, 20px in
navigation. An icon must help someone scan the screen. Decorative icons are
removed.
