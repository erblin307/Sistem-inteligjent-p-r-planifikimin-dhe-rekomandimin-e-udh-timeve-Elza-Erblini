"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  ACTIVITY_INTERESTS,
  FOOD_CUISINES,
  FOOD_DIETS,
  HOTEL_CATEGORIES,
  SUPPORTED_CURRENCIES,
  TRANSPORT_MODES,
  TRAVEL_STYLES,
  type ActivityInterest,
  type FoodCuisine,
  type FoodDiet,
  type HotelCategory,
  type SupportedCurrency,
  type TransportMode,
  type TravelStyle,
  type TripBriefErrors,
  type TripBriefField,
  type TripBriefInput,
  calculateTripDurationDays,
  validateTripBrief,
} from "@/contracts/trip-brief";
import { formatMoney, plural } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ChoiceChip } from "@/components/ui/choice-chip";
import { Field, Fieldset } from "@/components/ui/field";
import { Input, InputGroup } from "@/components/ui/input";
import { RadioGroup, RadioOption } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stepper, type Step } from "@/components/ui/stepper";

const steps: Step[] = [
  { id: "destination", title: "Destination", description: "Route and dates" },
  { id: "travelers", title: "Travelers", description: "Who is going" },
  { id: "budget", title: "Budget", description: "Spend and style" },
  { id: "accommodation", title: "Accommodation", description: "Hotel category" },
  { id: "interests", title: "Interests", description: "Things you enjoy" },
  { id: "preferences", title: "Preferences", description: "Transport and food" },
  { id: "review", title: "Review", description: "Check and generate" },
];

const stepFields: TripBriefField[][] = [
  ["departureLocation", "destination", "startDate", "endDate"],
  ["adults", "children"],
  ["budget", "currency", "travelStyle"],
  ["hotelPreference"],
  ["selectedActivities"],
  ["transportationPreference", "foodPreference"],
  [],
];

type PlannerState = {
  departureLocation: string;
  destination: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  budget: string;
  currency: SupportedCurrency;
  travelStyle: TravelStyle;
  hotelCategory: HotelCategory;
  activities: ActivityInterest[];
  transportModes: TransportMode[];
  foodDiets: FoodDiet[];
  foodCuisines: FoodCuisine[];
};

type ProblemResponse = {
  detail?: string;
  errors?: { path: string; message: string }[];
};

function toMinorUnits(value: string) {
  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(?:\.\d{0,2})?$/.test(normalized)) return Number.NaN;
  const [whole = "0", fraction = ""] = normalized.split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(amount) ? amount : Number.NaN;
}

function toPayload(state: PlannerState): TripBriefInput {
  return {
    departureLocation: state.departureLocation,
    destination: state.destination,
    startDate: state.startDate,
    endDate: state.endDate,
    travelers: { adults: state.adults, children: state.children },
    budget: { amountMinor: toMinorUnits(state.budget), currency: state.currency },
    travelStyle: state.travelStyle,
    hotelPreference: { category: state.hotelCategory },
    selectedActivities: state.activities,
    transportationPreference: { modes: state.transportModes },
    foodPreference: { diets: state.foodDiets, cuisines: state.foodCuisines },
  };
}

function toggleValue<T extends string>(values: T[], value: T, selected: boolean) {
  if (selected) return values.includes(value) ? values : [...values, value];
  return values.filter((item) => item !== value);
}

function optionLabel<T extends string>(
  options: readonly { value: T; label: string }[],
  value: T,
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function listLabels<T extends string>(
  options: readonly { value: T; label: string }[],
  values: T[],
) {
  return values.length > 0
    ? values.map((value) => optionLabel(options, value)).join(", ")
    : "No preference";
}

function formatReviewDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? "Not selected"
    : new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
}

function firstErrorStep(errors: TripBriefErrors) {
  const index = stepFields.findIndex((fields) => fields.some((field) => errors[field]));
  return index >= 0 ? index : 0;
}

function ReviewRow({
  label,
  value,
  step,
  onEdit,
}: {
  label: string;
  value: React.ReactNode;
  step: number;
  onEdit: (step: number) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-4 last:border-b-0">
      <div className="min-w-0">
        <p className="type-caption text-muted-foreground">{label}</p>
        <div className="mt-1 type-body text-foreground">{value}</div>
      </div>
      <Button type="button" variant="link" onClick={() => onEdit(step)} aria-label={`Edit ${label}`}>
        Edit
      </Button>
    </div>
  );
}

export function TripPlanner({ initialDestination = "" }: { initialDestination?: string }) {
  const router = useRouter();
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [errors, setErrors] = React.useState<TripBriefErrors>({});
  const [submitError, setSubmitError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [state, setState] = React.useState<PlannerState>({
    departureLocation: "",
    destination: initialDestination,
    startDate: "",
    endDate: "",
    adults: 1,
    children: 0,
    budget: "",
    currency: "EUR",
    travelStyle: "balanced",
    hotelCategory: "any",
    activities: [],
    transportModes: ["walk", "public-transit"],
    foodDiets: [],
    foodCuisines: [],
  });

  const durationDays = calculateTripDurationDays(state.startDate, state.endDate);
  const totalTravelers = state.adults + state.children;

  React.useEffect(() => {
    headingRef.current?.focus();
  }, [currentStep]);

  function clearError(field: TripBriefField) {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setSubmitError("");
  }

  function validateCurrentStep() {
    const result = validateTripBrief(toPayload(state));
    if (result.success) {
      setErrors({});
      return true;
    }
    const fields = stepFields[currentStep] ?? [];
    const currentErrors = Object.fromEntries(
      Object.entries(result.errors).filter(([field]) =>
        fields.includes(field as TripBriefField),
      ),
    ) as TripBriefErrors;
    setErrors(currentErrors);
    return Object.keys(currentErrors).length === 0;
  }

  function goNext() {
    if (!validateCurrentStep()) return;
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
  }

  function goBack() {
    setErrors({});
    setSubmitError("");
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  function editStep(step: number) {
    setErrors({});
    setSubmitError("");
    setCurrentStep(step);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    // Enter in a step with a single text field submits the form implicitly.
    // Treat that as Continue so no step, and never the Review step, is skipped.
    if (currentStep < steps.length - 1) {
      goNext();
      return;
    }

    const result = validateTripBrief(toPayload(state));
    if (!result.success) {
      setErrors(result.errors);
      setCurrentStep(firstErrorStep(result.errors));
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/v1/trips/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": crypto.randomUUID(),
        },
        body: JSON.stringify(toPayload(state)),
      });
      const body = (await response.json()) as
        | { data: { redirectUrl: string } }
        | ProblemResponse;

      if (!response.ok || !("data" in body)) {
        const problem = body as ProblemResponse;
        if (problem.errors?.length) {
          const serverErrors = Object.fromEntries(
            problem.errors.map((error) => [error.path, error.message]),
          ) as TripBriefErrors;
          setErrors(serverErrors);
          if (problem.errors.some((error) => error.path !== "destination")) {
            setCurrentStep(firstErrorStep(serverErrors));
          }
        }
        setSubmitError(problem.detail ?? "We couldn't generate your trip right now. Please try again.");
        return;
      }

      router.push(body.data.redirectUrl);
    } catch {
      setSubmitError("We couldn't generate your trip right now. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-[160px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,640px)] xl:gap-12">
      <Stepper steps={steps} current={currentStep} className="md:pt-2" />

      <form noValidate onSubmit={submit} className="min-w-0">
        <div className="flex min-h-80 flex-col gap-8">
          {currentStep === 0 ? (
            <section aria-labelledby="destination-step-title" className="flex flex-col gap-6">
              <div>
                <p className="type-overline text-primary">Step 1</p>
                <h2
                  id="destination-step-title"
                  ref={headingRef}
                  tabIndex={-1}
                  className="mt-1 type-title outline-none"
                >
                  Where and when are you traveling?
                </h2>
                <p className="mt-2 type-body text-muted-foreground">
                  Barcelona is the destination currently available in this catalog preview.
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <Field label="Departure location" error={errors.departureLocation}>
                  <Input
                    value={state.departureLocation}
                    onChange={(event) => {
                      setState((current) => ({
                        ...current,
                        departureLocation: event.target.value,
                      }));
                      clearError("departureLocation");
                    }}
                    autoComplete="off"
                    placeholder="e.g. Prishtina"
                  />
                </Field>
                <Field label="Destination" error={errors.destination}>
                  <Input
                    value={state.destination}
                    onChange={(event) => {
                      setState((current) => ({ ...current, destination: event.target.value }));
                      clearError("destination");
                    }}
                    autoComplete="off"
                    placeholder="Barcelona"
                  />
                </Field>
                <Field label="Start date" error={errors.startDate}>
                  <Input
                    type="date"
                    value={state.startDate}
                    onChange={(event) => {
                      setState((current) => ({ ...current, startDate: event.target.value }));
                      clearError("startDate");
                    }}
                  />
                </Field>
                <Field label="End date" error={errors.endDate}>
                  <Input
                    type="date"
                    min={state.startDate || undefined}
                    value={state.endDate}
                    onChange={(event) => {
                      setState((current) => ({ ...current, endDate: event.target.value }));
                      clearError("endDate");
                    }}
                  />
                </Field>
              </div>
              {durationDays ? (
                <p className="border-l-2 border-primary pl-4 type-body text-muted-foreground">
                  Your trip will span {plural(durationDays, "day")}.
                </p>
              ) : null}
            </section>
          ) : null}

          {currentStep === 1 ? (
            <section aria-labelledby="travelers-step-title" className="flex flex-col gap-6">
              <div>
                <p className="type-overline text-primary">Step 2</p>
                <h2
                  id="travelers-step-title"
                  ref={headingRef}
                  tabIndex={-1}
                  className="mt-1 type-title outline-none"
                >
                  Who is traveling?
                </h2>
                <p className="mt-2 type-body text-muted-foreground">
                  We use party size to keep hotel and activity recommendations realistic.
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <Field label="Adults" error={errors.adults}>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={10}
                    value={state.adults}
                    onChange={(event) => {
                      setState((current) => ({ ...current, adults: Number(event.target.value) }));
                      clearError("adults");
                    }}
                  />
                </Field>
                <Field label="Children" error={errors.children}>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={9}
                    value={state.children}
                    onChange={(event) => {
                      setState((current) => ({ ...current, children: Number(event.target.value) }));
                      clearError("children");
                    }}
                  />
                </Field>
              </div>
              <div className="border-y py-4">
                <p className="type-caption text-muted-foreground">Total travelers</p>
                <p className="mt-1 type-subheading tabular">{totalTravelers}</p>
              </div>
            </section>
          ) : null}

          {currentStep === 2 ? (
            <section aria-labelledby="budget-step-title" className="flex flex-col gap-6">
              <div>
                <p className="type-overline text-primary">Step 3</p>
                <h2
                  id="budget-step-title"
                  ref={headingRef}
                  tabIndex={-1}
                  className="mt-1 type-title outline-none"
                >
                  Set your budget and travel style
                </h2>
                <p className="mt-2 type-body text-muted-foreground">
                  Enter the total budget for the full trip and all travelers.
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_160px]">
                <Field label="Total budget" error={errors.budget}>
                  <InputGroup
                    leading="€"
                    inputMode="decimal"
                    value={state.budget}
                    onChange={(event) => {
                      setState((current) => ({ ...current, budget: event.target.value }));
                      clearError("budget");
                    }}
                    placeholder="1500"
                  />
                </Field>
                <Field label="Currency" error={errors.currency}>
                  <Select
                    value={state.currency}
                    onValueChange={(value: SupportedCurrency) => {
                      setState((current) => ({ ...current, currency: value }));
                      clearError("currency");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_CURRENCIES.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Fieldset legend="Travel style" error={errors.travelStyle}>
                <RadioGroup
                  value={state.travelStyle}
                  onValueChange={(value: TravelStyle) => {
                    setState((current) => ({ ...current, travelStyle: value }));
                    clearError("travelStyle");
                  }}
                  className="md:grid-cols-2"
                >
                  {TRAVEL_STYLES.map((style) => (
                    <RadioOption
                      key={style.value}
                      value={style.value}
                      title={style.label}
                      description={style.description}
                    />
                  ))}
                </RadioGroup>
              </Fieldset>
            </section>
          ) : null}

          {currentStep === 3 ? (
            <section aria-labelledby="accommodation-step-title" className="flex flex-col gap-6">
              <div>
                <p className="type-overline text-primary">Step 4</p>
                <h2
                  id="accommodation-step-title"
                  ref={headingRef}
                  tabIndex={-1}
                  className="mt-1 type-title outline-none"
                >
                  Choose your hotel preference
                </h2>
                <p className="mt-2 type-body text-muted-foreground">
                  We only ask for a category because the current preference model does not store
                  amenity requirements.
                </p>
              </div>
              <Field
                label="Hotel category"
                hint="Choose Any category if price and location matter more than star rating."
                error={errors.hotelPreference}
              >
                <Select
                  value={state.hotelCategory}
                  onValueChange={(value: HotelCategory) => {
                    setState((current) => ({ ...current, hotelCategory: value }));
                    clearError("hotelPreference");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOTEL_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </section>
          ) : null}

          {currentStep === 4 ? (
            <section aria-labelledby="interests-step-title" className="flex flex-col gap-6">
              <div>
                <p className="type-overline text-primary">Step 5</p>
                <h2
                  id="interests-step-title"
                  ref={headingRef}
                  tabIndex={-1}
                  className="mt-1 type-title outline-none"
                >
                  What are you interested in?
                </h2>
                <p className="mt-2 type-body text-muted-foreground">
                  Select all that apply. You can change these before generating the trip.
                </p>
              </div>
              <Fieldset
                legend="Activity interests"
                hint="Choose at least one interest."
                error={errors.selectedActivities}
              >
                <div className="flex flex-wrap gap-2">
                  {ACTIVITY_INTERESTS.map((interest) => (
                    <ChoiceChip
                      key={interest.value}
                      label={interest.label}
                      value={interest.value}
                      checked={state.activities.includes(interest.value)}
                      onCheckedChange={(checked) => {
                        setState((current) => ({
                          ...current,
                          activities: toggleValue(current.activities, interest.value, checked),
                        }));
                        clearError("selectedActivities");
                      }}
                    />
                  ))}
                </div>
              </Fieldset>
            </section>
          ) : null}

          {currentStep === 5 ? (
            <section aria-labelledby="preferences-step-title" className="flex flex-col gap-8">
              <div>
                <p className="type-overline text-primary">Step 6</p>
                <h2
                  id="preferences-step-title"
                  ref={headingRef}
                  tabIndex={-1}
                  className="mt-1 type-title outline-none"
                >
                  Add transport and food preferences
                </h2>
                <p className="mt-2 type-body text-muted-foreground">
                  These preferences help shape practical recommendations.
                </p>
              </div>
              <Fieldset
                legend="Transportation"
                hint="Select every mode you are comfortable using."
                error={errors.transportationPreference}
              >
                <div className="flex flex-wrap gap-2">
                  {TRANSPORT_MODES.map((mode) => (
                    <ChoiceChip
                      key={mode.value}
                      label={mode.label}
                      value={mode.value}
                      checked={state.transportModes.includes(mode.value)}
                      onCheckedChange={(checked) => {
                        setState((current) => ({
                          ...current,
                          transportModes: toggleValue(current.transportModes, mode.value, checked),
                        }));
                        clearError("transportationPreference");
                      }}
                    />
                  ))}
                </div>
              </Fieldset>
              <Fieldset
                legend="Food"
                hint="Leave all options unselected if you have no preference."
                error={errors.foodPreference}
              >
                <div className="flex flex-wrap gap-2">
                  {FOOD_CUISINES.map((preference) => (
                    <ChoiceChip
                      key={preference.value}
                      label={preference.label}
                      value={preference.value}
                      checked={state.foodCuisines.includes(preference.value)}
                      onCheckedChange={(checked) => {
                        setState((current) => ({
                          ...current,
                          foodCuisines: toggleValue(
                            current.foodCuisines,
                            preference.value,
                            checked,
                          ),
                        }));
                        clearError("foodPreference");
                      }}
                    />
                  ))}
                  {FOOD_DIETS.map((preference) => (
                    <ChoiceChip
                      key={preference.value}
                      label={preference.label}
                      value={preference.value}
                      checked={state.foodDiets.includes(preference.value)}
                      onCheckedChange={(checked) => {
                        setState((current) => ({
                          ...current,
                          foodDiets: toggleValue(current.foodDiets, preference.value, checked),
                        }));
                        clearError("foodPreference");
                      }}
                    />
                  ))}
                </div>
              </Fieldset>
            </section>
          ) : null}

          {currentStep === 6 ? (
            <section aria-labelledby="review-step-title" className="flex flex-col gap-6">
              <div>
                <p className="type-overline text-primary">Step 7</p>
                <h2
                  id="review-step-title"
                  ref={headingRef}
                  tabIndex={-1}
                  className="mt-1 type-title outline-none"
                >
                  Review your trip brief
                </h2>
                <p className="mt-2 type-body text-muted-foreground">
                  Check each section before opening the Barcelona trip workspace.
                </p>
              </div>
              <div className="border-y">
                <ReviewRow
                  label="Route"
                  value={`${state.departureLocation} → ${state.destination}`}
                  step={0}
                  onEdit={editStep}
                />
                <ReviewRow
                  label="Travel dates"
                  value={`${formatReviewDate(state.startDate)} – ${formatReviewDate(state.endDate)} · ${plural(durationDays ?? 0, "day")}`}
                  step={0}
                  onEdit={editStep}
                />
                <ReviewRow
                  label="Travelers"
                  value={`${plural(state.adults, "adult")} · ${plural(state.children, "child", "children")} · ${plural(totalTravelers, "traveler")}`}
                  step={1}
                  onEdit={editStep}
                />
                <ReviewRow
                  label="Budget and style"
                  value={`${formatMoney({ amountMinor: toMinorUnits(state.budget), currency: state.currency })} · ${optionLabel(TRAVEL_STYLES, state.travelStyle)}`}
                  step={2}
                  onEdit={editStep}
                />
                <ReviewRow
                  label="Hotel preference"
                  value={optionLabel(HOTEL_CATEGORIES, state.hotelCategory)}
                  step={3}
                  onEdit={editStep}
                />
                <ReviewRow
                  label="Activity interests"
                  value={listLabels(ACTIVITY_INTERESTS, state.activities)}
                  step={4}
                  onEdit={editStep}
                />
                <ReviewRow
                  label="Transportation"
                  value={listLabels(TRANSPORT_MODES, state.transportModes)}
                  step={5}
                  onEdit={editStep}
                />
                <ReviewRow
                  label="Food preferences"
                  value={[
                    listLabels(FOOD_CUISINES, state.foodCuisines),
                    listLabels(FOOD_DIETS, state.foodDiets),
                  ]
                    .filter((value, index, values) => value !== "No preference" || values.length === 1)
                    .join(", ") || "No preference"}
                  step={5}
                  onEdit={editStep}
                />
              </div>
              {submitError ? (
                <div role="alert" className="border-l-2 border-destructive pl-4">
                  <p className="type-label text-destructive">We couldn&apos;t generate your trip.</p>
                  <p className="mt-1 type-body text-muted-foreground">{submitError}</p>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        <div className="sticky bottom-14 z-20 -mx-4 mt-8 flex items-center justify-between gap-4 border-t bg-background px-4 py-4 md:static md:mx-0 md:px-0">
          {currentStep > 0 ? (
            <Button type="button" onClick={goBack} disabled={isSubmitting}>
              Previous
            </Button>
          ) : (
            <span />
          )}
          {currentStep < steps.length - 1 ? (
            <Button key="continue" type="button" variant="primary" onClick={goNext}>
              Continue
            </Button>
          ) : (
            <Button key="generate" type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Creating your personalized trip…" : "Generate My Trip"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
