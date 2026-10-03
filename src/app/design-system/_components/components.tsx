"use client";

import * as React from "react";
import {
  ArrowRight,
  Bike,
  Building2,
  Bus,
  CalendarDays,
  Copy,
  Footprints,
  Landmark,
  MoreHorizontal,
  Pencil,
  Search,
  Trash2,
  Trees,
  UtensilsCrossed,
  Wine,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ChoiceChip } from "@/components/ui/choice-chip";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, Fieldset } from "@/components/ui/field";
import { Input, InputGroup } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioOption } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Stepper } from "@/components/ui/stepper";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocSection, Rule, Stage } from "./specimen";

const interests = [
  { id: "architecture", label: "Architecture", icon: <Building2 aria-hidden /> },
  { id: "museums", label: "Museums", icon: <Landmark aria-hidden /> },
  { id: "food", label: "Food & markets", icon: <UtensilsCrossed aria-hidden /> },
  { id: "nature", label: "Parks & nature", icon: <Trees aria-hidden /> },
  { id: "nightlife", label: "Nightlife", icon: <Wine aria-hidden /> },
];

const planSteps = [
  { id: "where", title: "Destination and dates", description: "Barcelona · 12–17 July" },
  { id: "who", title: "Travelers and budget", description: "2 adults · €1,500" },
  { id: "stay", title: "Accommodation" },
  { id: "interests", title: "Interests and activities" },
  { id: "review", title: "Review" },
];

export function Components() {
  return (
    <>
      <DocSection
        id="buttons"
        title="Buttons"
        description="Three heights on the 8px grid: 32, 40 and 48. One primary button per view; everything else is secondary or ghost."
      >
        <Stage className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary">
              Generate plan <ArrowRight aria-hidden />
            </Button>
            <Button variant="secondary">Save draft</Button>
            <Button variant="ghost">Cancel</Button>
            <Button variant="link">View all hotels</Button>
            <Button variant="destructive">
              <Trash2 aria-hidden /> Delete trip
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary" size="lg">
              Continue
            </Button>
            <Button variant="primary">Continue</Button>
            <Button variant="primary" size="sm">
              Continue
            </Button>
            <Button size="icon" aria-label="More actions">
              <MoreHorizontal aria-hidden />
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label="Edit">
              <Pencil aria-hidden />
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>
        </Stage>
        <ul className="flex max-w-prose flex-col gap-2">
          <Rule kind="do">Label buttons with the verb and object: “Select hotel”, “Add to day”.</Rule>
          <Rule kind="do">Use large (48px) only for the main step action on mobile.</Rule>
          <Rule kind="dont">Place two primary buttons side by side.</Rule>
        </ul>
      </DocSection>

      <DocSection
        id="forms"
        title="Forms"
        description="Every control has a visible label. Hints sit under the control; errors replace the hint and say how to fix the problem. Validation runs on blur and when moving to the next step."
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
          <Stage className="flex flex-col gap-8">
            <FormSpecimen />
          </Stage>
          <Stage className="hidden xl:block">
            <Stepper steps={planSteps} current={2} />
          </Stage>
        </div>
      </DocSection>

      <DocSection
        id="selection"
        title="Selection"
        description="Chips for multi-select preferences, radio rows for a single choice that needs explanation, checkboxes and switches for settings."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <Stage className="flex flex-col gap-6">
            <ChipSpecimen />
          </Stage>
          <Stage className="flex flex-col gap-6">
            <Fieldset legend="Accommodation type">
              <RadioGroup defaultValue="hotel">
                <RadioOption
                  value="hotel"
                  title="Hotel"
                  description="Daily cleaning, reception, breakfast options"
                  meta="from €96"
                />
                <RadioOption
                  value="apartment"
                  title="Apartment"
                  description="Kitchen and more space, self check-in"
                  meta="from €84"
                />
              </RadioGroup>
            </Fieldset>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Checkbox id="cancel" defaultChecked />
                <Label htmlFor="cancel" className="font-normal">
                  Only show free cancellation
                </Label>
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="transport" className="font-normal">
                  Include flights in budget
                </Label>
                <Switch id="transport" defaultChecked />
              </div>
            </div>
          </Stage>
        </div>
      </DocSection>

      <DocSection
        id="navigation"
        title="Tabs, badges and menus"
        description="Underline tabs switch views of one trip. Segmented tabs switch a local mode. Badges report state in a word."
      >
        <Stage className="flex flex-col gap-8">
          <Tabs defaultValue="itinerary">
            <TabsList aria-label="Trip workspace">
              {["Overview", "Itinerary", "Map", "Hotels", "Activities", "Budget"].map((t) => (
                <TabsTrigger key={t} value={t.toLowerCase()}>
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="itinerary" className="pt-4 type-body text-muted-foreground">
              The tab bar sits directly under the trip header and scrolls horizontally on small screens.
            </TabsContent>
          </Tabs>

          <div className="flex flex-wrap items-center gap-6">
            <Tabs defaultValue="list">
              <TabsList variant="segmented" aria-label="View">
                <TabsTrigger value="list">List</TabsTrigger>
                <TabsTrigger value="map">Map</TabsTrigger>
              </TabsList>
            </Tabs>
            <Tabs defaultValue="d2">
              <TabsList variant="segmented" aria-label="Day">
                {["Mon 12", "Tue 13", "Wed 14", "Thu 15"].map((d, i) => (
                  <TabsTrigger key={d} value={`d${i + 1}`} className="tabular">
                    {d}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="brand">Recommended</Badge>
            <Badge variant="success">Booked</Badge>
            <Badge variant="warning">Book ahead</Badge>
            <Badge variant="danger">Over budget</Badge>
            <Badge variant="neutral">Draft</Badge>
            <Badge variant="outline">Closed Mondays</Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">
                  Trip actions <MoreHorizontal aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>
                  <Pencil aria-hidden /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CalendarDays aria-hidden /> Change dates
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Copy aria-hidden /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive>
                  <Trash2 aria-hidden /> Delete trip
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DialogSpecimen />
          </div>
        </Stage>
      </DocSection>
    </>
  );
}

function FormSpecimen() {
  const [destination, setDestination] = React.useState("Barcelona");
  const [budget, setBudget] = React.useState("300");
  const [touched, setTouched] = React.useState(true);
  const budgetNum = Number(budget);
  const budgetError =
    touched && (!budget || Number.isNaN(budgetNum) || budgetNum <= 0)
      ? "Enter a budget greater than €0."
      : touched && budgetNum < 600
        ? "€300 is below the €600 minimum for 2 travelers over 5 nights in Barcelona. Increase the budget or shorten the trip."
        : undefined;

  return (
    <>
      <Field label="Destination" hint="Cities with full planning support are listed first.">
        <InputGroup
          leading={<Search aria-hidden />}
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          autoComplete="off"
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Check-in">
          <Input type="date" defaultValue="2027-07-12" />
        </Field>
        <Field label="Check-out" hint="5 nights">
          <Input type="date" defaultValue="2027-07-17" />
        </Field>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Total budget" error={budgetError}>
          <InputGroup
            inputMode="numeric"
            leading={<span className="type-body">€</span>}
            trailing="EUR"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            onBlur={() => setTouched(true)}
          />
        </Field>
        <Field label="Hotel category">
          <Select defaultValue="4">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any category</SelectItem>
              <SelectItem value="3">3 stars and above</SelectItem>
              <SelectItem value="4">4 stars and above</SelectItem>
              <SelectItem value="5">5 stars</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Departure city" optional hint="Used to estimate flights or trains.">
        <Input placeholder="e.g. Prishtina" />
      </Field>
      <div className="flex flex-col-reverse gap-2 border-t pt-6 md:flex-row md:justify-between">
        <Button variant="ghost">Back</Button>
        <Button variant="primary">
          Continue to accommodation <ArrowRight aria-hidden />
        </Button>
      </div>
    </>
  );
}

function ChipSpecimen() {
  const [picked, setPicked] = React.useState<string[]>(["architecture", "food"]);
  const [modes, setModes] = React.useState<string[]>(["walk", "transit"]);
  const toggle = (list: string[], set: (v: string[]) => void, id: string, on: boolean) =>
    set(on ? [...list, id] : list.filter((x) => x !== id));

  return (
    <>
      <Fieldset
        legend="Interests"
        hint="Pick at least one. We use these to rank activities."
        error={picked.length === 0 ? "Choose at least one interest." : undefined}
      >
        <div className="flex flex-wrap gap-2">
          {interests.map((i) => (
            <ChoiceChip
              key={i.id}
              label={i.label}
              icon={i.icon}
              checked={picked.includes(i.id)}
              onCheckedChange={(on) => toggle(picked, setPicked, i.id, on)}
            />
          ))}
        </div>
      </Fieldset>
      <Fieldset legend="Getting around">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "walk", label: "Walking", icon: <Footprints aria-hidden /> },
            { id: "transit", label: "Public transport", icon: <Bus aria-hidden /> },
            { id: "bike", label: "Bike", icon: <Bike aria-hidden /> },
          ].map((m) => (
            <ChoiceChip
              key={m.id}
              label={m.label}
              icon={m.icon}
              checked={modes.includes(m.id)}
              onCheckedChange={(on) => toggle(modes, setModes, m.id, on)}
            />
          ))}
        </div>
      </Fieldset>
    </>
  );
}

function DialogSpecimen() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regenerate this plan?</DialogTitle>
          <DialogDescription>
            We will build a new version from your current preferences. The 3 items you locked stay
            where they are.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="flex items-center gap-2">
            <Checkbox id="keep-hotel" defaultChecked />
            <Label htmlFor="keep-hotel" className="font-normal">
              Keep Hotel Casa Fuster
            </Label>
          </div>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button variant="primary">Regenerate plan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
