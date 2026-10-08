"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  ACCOMMODATION_TYPE_OPTIONS,
  DIET_OPTIONS,
  HOTEL_STAR_OPTIONS,
  PACE_OPTIONS,
  SUPPORTED_CURRENCIES,
  TRANSPORT_OPTIONS,
  TRAVEL_STYLE_OPTIONS,
  type TripFormErrors,
  type TripFormField,
  type TripFormState,
  fieldForIssuePath,
  initialTripFormState,
  toCreateTripInput,
  toMinorUnits,
  validateTripForm,
} from "@/lib/trip-form";
import { dayCount } from "@/contracts/trip";
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
  { id: "accommodation", title: "Accommodation", description: "Category and type" },
  { id: "interests", title: "Interests", description: "Things you enjoy" },
  { id: "preferences", title: "Preferences", description: "Pace, transport, food" },
  { id: "review", title: "Review", description: "Check and create" },
];

const stepFields: TripFormField[][] = [
  ["departureCity", "destinationId", "startDate", "endDate"],
  ["adults", "childAges"],
  ["budget", "currency", "travelStyle"],
  ["minHotelStars", "accommodationType"],
  ["interests"],
  ["pace", "localTransportModes", "dietaryRequirements"],
  [],
];

export type DestinationOption = { id: string; name: string; countryCode: string };
export type InterestOption = { slug: string; name: string };

type ProblemResponse = {
  detail?: string;
  errors?: { path: string; message: string }[];
};

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

function firstErrorStep(errors: TripFormErrors) {
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

export function TripPlanner({
  destinations,
  interests,
  initialDestinationId = "",
}: {
  destinations: DestinationOption[];
  interests: InterestOption[];
  initialDestinationId?: string;
}) {
  const router = useRouter();
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const [currentStep, setCurrentStep] = React.useState(0);
  const [errors, setErrors] = React.useState<TripFormErrors>({});
  const [submitError, setSubmitError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [state, setState] = React.useState<TripFormState>(() =>
    initialTripFormState(initialDestinationId),
  );

  const hasDates = /^\d{4}-\d{2}-\d{2}$/.test(state.startDate) && /^\d{4}-\d{2}-\d{2}$/.test(state.endDate);
  const durationDays = hasDates && state.endDate >= state.startDate ? dayCount(state.startDate, state.endDate) : null;
  const totalTravelers = state.adults + state.childAges.length;
  const destinationName = destinations.find((d) => d.id === state.destinationId)?.name ?? "";
  const interestOptions = interests.map((i) => ({ value: i.slug, label: i.name }));

  React.useEffect(() => {
    headingRef.current?.focus();
  }, [currentStep]);

  function update(patch: Partial<TripFormState>, ...fields: TripFormField[]) {
    setState((current) => ({ ...current, ...patch }));
    setErrors((current) => {
      if (!fields.some((field) => current[field])) return current;
      const next = { ...current };
      for (const field of fields) delete next[field];
      return next;
    });
    setSubmitError("");
  }

  function validateCurrentStep() {
    const allErrors = validateTripForm(state);
    const fields = stepFields[currentStep] ?? [];
    const currentErrors = Object.fromEntries(
      Object.entries(allErrors).filter(([field]) => fields.includes(field as TripFormField)),
    ) as TripFormErrors;
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

    const allErrors = validateTripForm(state);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setCurrentStep(firstErrorStep(allErrors));
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/v1/trips", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(toCreateTripInput(state)),
      });
      const body = (await response.json()) as { id: string } | ProblemResponse;

      if (!response.ok || !("id" in body)) {
        const problem = body as ProblemResponse;
        if (problem.errors?.length) {
          const serverErrors: TripFormErrors = {};
          for (const issue of problem.errors) {
            const field = fieldForIssuePath(issue.path);
            if (field && !serverErrors[field]) serverErrors[field] = issue.message;
          }
          if (Object.keys(serverErrors).length > 0) {
            setErrors(serverErrors);
            setCurrentStep(firstErrorStep(serverErrors));
          }
        }
        setSubmitError(problem.detail ?? "We couldn't create your trip right now. Please try again.");
        return;
      }

      router.push(`/trips/${body.id}/overview`);
    } catch {
      setSubmitError("We couldn't create your trip right now. Check your connection and try again.");
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
                  Choose a destination from the catalog. More destinations appear here as they are added.
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <Field label="Departure city" error={errors.departureCity}>
                  <Input
                    value={state.departureCity}
                    onChange={(event) => update({ departureCity: event.target.value }, "departureCity")}
                    autoComplete="off"
                    placeholder="e.g. Prishtina"
                  />
                </Field>
                <Field label="Destination" error={errors.destinationId}>
                  <Select
                    value={state.destinationId}
                    onValueChange={(value) => update({ destinationId: value }, "destinationId")}
                    disabled={destinations.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a destination" />
                    </SelectTrigger>
                    <SelectContent>
                      {destinations.map((destination) => (
                        <SelectItem key={destination.id} value={destination.id}>
                          {destination.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Start date" error={errors.startDate}>
                  <Input
                    type="date"
                    value={state.startDate}
                    onChange={(event) => update({ startDate: event.target.value }, "startDate")}
                  />
                </Field>
                <Field label="End date" error={errors.endDate}>
                  <Input
                    type="date"
                    min={state.startDate || undefined}
                    value={state.endDate}
                    onChange={(event) => update({ endDate: event.target.value }, "endDate")}
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
                  We use party size and children&apos;s ages to keep hotel and activity
                  recommendations realistic.
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
                    onChange={(event) => update({ adults: Number(event.target.value) }, "adults")}
                  />
                </Field>
                <Field label="Children" hint="Under 18 on the start date.">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={9}
                    value={state.childAges.length}
                    onChange={(event) => {
                      const count = Math.max(0, Math.min(9, Math.trunc(Number(event.target.value) || 0)));
                      update(
                        {
                          childAges: Array.from({ length: count }, (_, i) => state.childAges[i] ?? Number.NaN),
                        },
                        "childAges",
                        "adults",
                      );
                    }}
                  />
                </Field>
              </div>
              {state.childAges.length > 0 ? (
                <Fieldset legend="Children's ages" error={errors.childAges}>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {state.childAges.map((age, index) => (
                      <Field key={index} label={`Child ${index + 1}`}>
                        <Input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={17}
                          value={Number.isNaN(age) ? "" : age}
                          onChange={(event) => {
                            const next = [...state.childAges];
                            next[index] = event.target.value === "" ? Number.NaN : Number(event.target.value);
                            update({ childAges: next }, "childAges");
                          }}
                        />
                      </Field>
                    ))}
                  </div>
                </Fieldset>
              ) : null}
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
                    onChange={(event) => update({ budget: event.target.value }, "budget")}
                    placeholder="1500"
                  />
                </Field>
                <Field label="Currency" error={errors.currency}>
                  <Select
                    value={state.currency}
                    onValueChange={(value: TripFormState["currency"]) => update({ currency: value }, "currency")}
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
                  onValueChange={(value: TripFormState["travelStyle"]) =>
                    update({ travelStyle: value }, "travelStyle")
                  }
                  className="md:grid-cols-2"
                >
                  {TRAVEL_STYLE_OPTIONS.map((style) => (
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
                  Choose your accommodation preference
                </h2>
                <p className="mt-2 type-body text-muted-foreground">
                  Hotel recommendations are ranked against these preferences and your budget.
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <Field
                  label="Hotel category"
                  hint="Choose Any category if price and location matter more."
                  error={errors.minHotelStars}
                >
                  <Select
                    value={state.minHotelStars}
                    onValueChange={(value: TripFormState["minHotelStars"]) =>
                      update({ minHotelStars: value }, "minHotelStars")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOTEL_STAR_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Accommodation type" error={errors.accommodationType}>
                  <Select
                    value={state.accommodationType}
                    onValueChange={(value: TripFormState["accommodationType"]) =>
                      update({ accommodationType: value }, "accommodationType")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOMMODATION_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
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
                  Select all that apply. Activities are matched to these interests.
                </p>
              </div>
              <Fieldset legend="Activity interests" hint="Choose at least one interest." error={errors.interests}>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map((interest) => (
                    <ChoiceChip
                      key={interest.value}
                      label={interest.label}
                      value={interest.value}
                      checked={state.interests.includes(interest.value)}
                      onCheckedChange={(checked) =>
                        update(
                          { interests: toggleValue(state.interests, interest.value, checked) },
                          "interests",
                        )
                      }
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
                  Pace, transport and food
                </h2>
                <p className="mt-2 type-body text-muted-foreground">
                  These preferences help shape practical recommendations.
                </p>
              </div>
              <Fieldset legend="Travel pace" error={errors.pace}>
                <RadioGroup
                  value={state.pace}
                  onValueChange={(value: TripFormState["pace"]) => update({ pace: value }, "pace")}
                  className="md:grid-cols-3"
                >
                  {PACE_OPTIONS.map((pace) => (
                    <RadioOption key={pace.value} value={pace.value} title={pace.label} description={pace.description} />
                  ))}
                </RadioGroup>
              </Fieldset>
              <Fieldset
                legend="Getting around"
                hint="Select every mode you are comfortable using."
                error={errors.localTransportModes}
              >
                <div className="flex flex-wrap gap-2">
                  {TRANSPORT_OPTIONS.map((mode) => (
                    <ChoiceChip
                      key={mode.value}
                      label={mode.label}
                      value={mode.value}
                      checked={state.localTransportModes.includes(mode.value)}
                      onCheckedChange={(checked) =>
                        update(
                          { localTransportModes: toggleValue(state.localTransportModes, mode.value, checked) },
                          "localTransportModes",
                        )
                      }
                    />
                  ))}
                </div>
              </Fieldset>
              <Fieldset
                legend="Dietary requirements"
                hint="Leave all options unselected if you have none."
                error={errors.dietaryRequirements}
              >
                <div className="flex flex-wrap gap-2">
                  {DIET_OPTIONS.map((diet) => (
                    <ChoiceChip
                      key={diet.value}
                      label={diet.label}
                      value={diet.value}
                      checked={state.dietaryRequirements.includes(diet.value)}
                      onCheckedChange={(checked) =>
                        update(
                          { dietaryRequirements: toggleValue(state.dietaryRequirements, diet.value, checked) },
                          "dietaryRequirements",
                        )
                      }
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
                  Check each section, then create the trip. It is saved and opens in its workspace.
                </p>
              </div>
              <div className="border-y">
                <ReviewRow label="Route" value={`${state.departureCity} → ${destinationName}`} step={0} onEdit={editStep} />
                <ReviewRow
                  label="Travel dates"
                  value={`${formatReviewDate(state.startDate)} – ${formatReviewDate(state.endDate)} · ${plural(durationDays ?? 0, "day")}`}
                  step={0}
                  onEdit={editStep}
                />
                <ReviewRow
                  label="Travelers"
                  value={[
                    plural(state.adults, "adult"),
                    state.childAges.length > 0
                      ? `${plural(state.childAges.length, "child", "children")} (aged ${state.childAges.join(", ")})`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  step={1}
                  onEdit={editStep}
                />
                <ReviewRow
                  label="Budget and style"
                  value={`${formatMoney({ amountMinor: toMinorUnits(state.budget), currency: state.currency })} · ${optionLabel(TRAVEL_STYLE_OPTIONS, state.travelStyle)}`}
                  step={2}
                  onEdit={editStep}
                />
                <ReviewRow
                  label="Accommodation"
                  value={`${optionLabel(HOTEL_STAR_OPTIONS, state.minHotelStars)} · ${optionLabel(ACCOMMODATION_TYPE_OPTIONS, state.accommodationType)}`}
                  step={3}
                  onEdit={editStep}
                />
                <ReviewRow label="Interests" value={listLabels(interestOptions, state.interests)} step={4} onEdit={editStep} />
                <ReviewRow label="Pace" value={optionLabel(PACE_OPTIONS, state.pace)} step={5} onEdit={editStep} />
                <ReviewRow
                  label="Getting around"
                  value={listLabels(TRANSPORT_OPTIONS, state.localTransportModes)}
                  step={5}
                  onEdit={editStep}
                />
                <ReviewRow
                  label="Dietary requirements"
                  value={listLabels(DIET_OPTIONS, state.dietaryRequirements)}
                  step={5}
                  onEdit={editStep}
                />
              </div>
              {submitError ? (
                <div role="alert" className="border-l-2 border-destructive pl-4">
                  <p className="type-label text-destructive">We couldn&apos;t create your trip.</p>
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
              {isSubmitting ? "Creating your trip…" : "Create trip"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
