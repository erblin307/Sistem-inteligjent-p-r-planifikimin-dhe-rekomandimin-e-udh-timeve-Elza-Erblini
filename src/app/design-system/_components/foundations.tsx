import * as React from "react";
import { Bookmark, CalendarDays, Clock, MapPin, Route, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { DocBlock, DocSection, Rule, Stage } from "./specimen";
import { TokenValue } from "./token-value";

type Swatch = { token: string; name: string; use: string; className: string };

const neutrals: Swatch[] = [
  { token: "--background", name: "Canvas", use: "App background behind content", className: "bg-background" },
  { token: "--surface", name: "Surface", use: "Cards, panels, inputs, tables", className: "bg-surface" },
  { token: "--surface-subtle", name: "Surface subtle", use: "Table headers, selected rows", className: "bg-surface-subtle" },
  { token: "--muted", name: "Muted", use: "Image placeholders, meter tracks, active nav", className: "bg-muted" },
  { token: "--border", name: "Border", use: "Hairlines between rows and around cards", className: "bg-border" },
  { token: "--border-strong", name: "Border strong", use: "Input borders, dividers that must read", className: "bg-border-strong" },
  { token: "--subtle-foreground", name: "Text tertiary", use: "Icons in metadata, placeholders. Never body copy.", className: "bg-subtle-foreground" },
  { token: "--muted-foreground", name: "Text secondary", use: "Descriptions, metadata, captions", className: "bg-muted-foreground" },
  { token: "--foreground", name: "Text primary", use: "Titles, body copy, figures", className: "bg-foreground" },
];

const brand: Swatch[] = [
  { token: "--primary", name: "Harbour", use: "Primary action, selection, focus, current step", className: "bg-primary" },
  { token: "--primary-hover", name: "Harbour hover", use: "Hover and pressed state of primary", className: "bg-primary-hover" },
  { token: "--primary-subtle", name: "Harbour tint", use: "Selected rows and chips, recommended badge", className: "bg-primary-subtle" },
];

const status: Swatch[] = [
  { token: "--success", name: "Success", use: "Booked, free cancellation, under budget", className: "bg-success" },
  { token: "--warning", name: "Warning", use: "Book ahead, tight schedule, close to budget", className: "bg-warning" },
  { token: "--destructive", name: "Danger", use: "Errors, over budget, destructive actions", className: "bg-destructive" },
];

function SwatchList({ items }: { items: Swatch[] }) {
  return (
    <ul className="divide-y rounded-lg border bg-surface">
      {items.map((s) => (
        <li
          key={s.token}
          className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-4 px-4 py-4 md:grid-cols-[40px_200px_120px_minmax(0,1fr)]"
        >
          <span className={cn("size-10 rounded-md border", s.className)} />
          <span className="flex min-w-0 flex-col">
            <span className="type-label">{s.name}</span>
            <code className="font-mono type-caption text-muted-foreground">{s.token}</code>
          </span>
          <span className="hidden md:block">
            <TokenValue name={s.token} />
          </span>
          <span className="col-span-2 type-body text-muted-foreground md:col-span-1">{s.use}</span>
        </li>
      ))}
    </ul>
  );
}

const typeRoles = [
  { cls: "type-title", name: "Title", spec: "24 / 32 · 600 · −1%", use: "One per page: page or trip name", sample: "Barcelona" },
  { cls: "type-heading", name: "Heading", spec: "18 / 28 · 600", use: "Page sections, dialog titles", sample: "Recommended hotels" },
  { cls: "type-subheading", name: "Subheading", spec: "16 / 24 · 600", use: "Card titles, day headings", sample: "Tuesday, 13 July" },
  { cls: "type-figure", name: "Figure", spec: "20 / 28 · 600 · tabular", use: "Prices and budget totals", sample: "€1,284" },
  { cls: "type-reading", name: "Reading", spec: "16 / 24 · 400", use: "Longer descriptions, help text blocks", sample: "Gaudí’s basilica, under construction since 1882." },
  { cls: "type-label", name: "Label", spec: "14 / 20 · 500", use: "Form labels, buttons, item titles", sample: "Check-in date" },
  { cls: "type-body", name: "Body", spec: "14 / 20 · 400", use: "Default UI text, table cells, metadata", sample: "Gràcia · 2.1 km from centre" },
  { cls: "type-caption", name: "Caption", spec: "12 / 16 · 400", use: "Hints, secondary figures, timestamps", sample: "€710 total · 5 nights, 1 room" },
  { cls: "type-overline", name: "Overline", spec: "12 / 16 · 500 · caps +4%", use: "Table headers and menu group labels only", sample: "Planned" },
];

const spacing = [
  { key: "1", px: 4, use: "Icon to text, label to hint" },
  { key: "2", px: 8, use: "Related items: label to input, chip gap" },
  { key: "4", px: 16, use: "Card padding (mobile), field to field, page gutter (mobile)" },
  { key: "6", px: 24, use: "Card padding (tablet+), page gutter (tablet)" },
  { key: "8", px: 32, use: "Between blocks inside a section, page gutter (desktop)" },
  { key: "12", px: 48, use: "Between page sections" },
  { key: "16", px: 64, use: "Major separation, empty page top offset" },
];

export function Foundations() {
  return (
    <>
      <DocSection
        id="colour"
        title="Colour"
        description="A warm neutral base with a single brand accent. Colour marks interaction and state. It never decorates. Status colours appear only when there is a status to report."
      >
        <DocBlock title="Neutrals" description="Hierarchy comes from these steps and from borders, not from shadows or tinted panels.">
          <SwatchList items={neutrals} />
        </DocBlock>
        <DocBlock
          title="Brand accent"
          description="Harbour is a deep petrol blue, chosen for contrast on white (7.6:1) and to stay calm next to photography. It is the only accent: there are no secondary brand colours."
        >
          <SwatchList items={brand} />
        </DocBlock>
        <DocBlock title="Status" description="Always paired with a word or icon. Colour alone never carries meaning.">
          <SwatchList items={status} />
        </DocBlock>
      </DocSection>

      <DocSection
        id="typography"
        title="Typography"
        description="Instrument Sans throughout. It stays clear at 12–14px, has true tabular figures with narrow punctuation, and covers Latin Extended for place names such as Gràcia or Prishtinë. Nine roles cover every screen. Weights stop at 600."
      >
        <ul className="divide-y rounded-lg border bg-surface">
          {typeRoles.map((r) => (
            <li
              key={r.cls}
              className="grid gap-2 px-4 py-4 md:grid-cols-[minmax(0,1fr)_160px_200px] md:items-baseline md:gap-6 md:px-6"
            >
              <span className={cn(r.cls, "min-w-0 truncate")}>{r.sample}</span>
              <span className="flex flex-col">
                <span className="type-label">{r.name}</span>
                <code className="font-mono type-caption text-muted-foreground">.{r.cls}</code>
              </span>
              <span className="flex flex-col">
                <span className="type-body tabular">{r.spec}</span>
                <span className="type-caption text-muted-foreground">{r.use}</span>
              </span>
            </li>
          ))}
        </ul>
        <ul className="flex max-w-prose flex-col gap-2">
          <Rule kind="do">Use tabular figures for every price, time and duration so columns align.</Rule>
          <Rule kind="do">Write titles in sentence case: “Plan a trip”, not “Plan A Trip”.</Rule>
          <Rule kind="dont">Set marketing-size headings inside the app. The largest size is 24px.</Rule>
          <Rule kind="dont">Combine size and weight utilities by hand. Use a role.</Rule>
        </ul>
      </DocSection>

      <DocSection
        id="spacing"
        title="Spacing and layout"
        description="An 8px system with a 4px half-step. Padding, margin and gap use only these seven values; the theme does not generate others."
      >
        <ul className="flex flex-col gap-2 rounded-lg border bg-surface p-4 md:p-6">
          {spacing.map((s) => (
            <li key={s.key} className="grid grid-cols-[56px_64px_minmax(0,1fr)] items-center gap-4 md:grid-cols-[56px_80px_minmax(0,1fr)]">
              <code className="font-mono type-caption text-muted-foreground">{s.key}</code>
              <span className="flex items-center">
                <span className="h-4 bg-primary" style={{ width: s.px }} />
              </span>
              <span className="type-body">
                <span className="font-medium tabular">{s.px}px</span>
                <span className="text-muted-foreground"> · {s.use}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { bp: "Mobile", range: "< 768px", gutter: "16px", nav: "Bottom tab bar", cols: "1 column, full-bleed lists" },
            { bp: "Tablet", range: "768–1279px", gutter: "24px", nav: "64px icon rail", cols: "Content + bottom map panel" },
            { bp: "Desktop", range: "≥ 1280px", gutter: "32px", nav: "240px sidebar", cols: "60 / 40 list and map" },
          ].map((b) => (
            <div key={b.bp} className="flex flex-col gap-2 border-t-2 border-foreground pt-4">
              <p className="type-subheading">{b.bp}</p>
              <dl className="grid grid-cols-[80px_minmax(0,1fr)] gap-y-1 type-body">
                <dt className="text-muted-foreground">Width</dt>
                <dd className="tabular">{b.range}</dd>
                <dt className="text-muted-foreground">Gutter</dt>
                <dd className="tabular">{b.gutter}</dd>
                <dt className="text-muted-foreground">Navigation</dt>
                <dd>{b.nav}</dd>
                <dt className="text-muted-foreground">Workspace</dt>
                <dd>{b.cols}</dd>
              </dl>
            </div>
          ))}
        </div>
      </DocSection>

      <DocSection
        id="shape"
        title="Shape and elevation"
        description="Borders and spacing do the work. Radius stays small, and only floating layers cast a shadow."
      >
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { r: "rounded-sm", v: "4px", use: "Badges, checkboxes, thumbnails" },
            { r: "rounded-md", v: "8px", use: "Inputs, buttons, chips, menus" },
            { r: "rounded-lg", v: "12px", use: "Cards, dialogs, image frames" },
            { r: "rounded-full", v: "Full", use: "Avatars and map markers only" },
          ].map((x) => (
            <div key={x.r} className="flex flex-col gap-2">
              <div className={cn("h-20 border border-border-strong bg-surface", x.r)} />
              <p className="type-label">
                {x.v} <code className="font-mono type-caption font-normal text-muted-foreground">.{x.r}</code>
              </p>
              <p className="type-caption text-muted-foreground">{x.use}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Stage tone="canvas" className="flex flex-col gap-4">
            <p className="type-label">Resting content</p>
            <div className="rounded-lg border bg-surface p-4 type-body text-muted-foreground">
              Border, no shadow. Sits flat on the canvas.
            </div>
          </Stage>
          <Stage tone="canvas" className="flex flex-col gap-4">
            <p className="type-label">Floating layer</p>
            <div className="rounded-md border bg-popover p-4 type-body text-muted-foreground shadow-overlay">
              <code className="font-mono type-caption">shadow-overlay</code>: menus, popovers, dialogs, the map
              card. Nothing else.
            </div>
          </Stage>
        </div>
      </DocSection>

      <DocSection
        id="icons"
        title="Icons"
        description="Lucide at 1.75 stroke. 16px inside controls and metadata, 20px in navigation. An icon must help someone scan. If removing it loses nothing, remove it."
      >
        <Stage className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-x-8 gap-y-4 type-body text-muted-foreground">
            {[
              [CalendarDays, "Dates"],
              [Users, "Travelers"],
              [MapPin, "Location"],
              [Clock, "Duration"],
              [Route, "Plan a trip"],
              [Bookmark, "Saved"],
            ].map(([Icon, label]) => {
              const I = Icon as typeof CalendarDays;
              return (
                <span key={label as string} className="inline-flex items-center gap-2">
                  <I aria-hidden className="size-4 text-subtle-foreground" strokeWidth={1.75} />
                  {label as string}
                </span>
              );
            })}
          </div>
        </Stage>
      </DocSection>
    </>
  );
}
