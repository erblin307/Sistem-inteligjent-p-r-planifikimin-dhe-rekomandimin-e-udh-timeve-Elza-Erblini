import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Wordmark } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ItineraryTimeline } from "@/components/travel/itinerary-timeline";
import { TripHeader } from "@/components/travel/trip-header";
import { dayTwo, trip } from "@/lib/fixtures/barcelona";

export const metadata: Metadata = {
  title: "Intelligent travel planning",
  description: "Create a personal trip plan shaped around your destination, budget and preferences.",
};

const steps = [
  {
    title: "Choose your destination",
    description: "Tell us where you want to go and when you plan to travel.",
  },
  {
    title: "Set your budget and preferences",
    description: "Add your travel style, hotel needs, interests and preferred transport.",
  },
  {
    title: "Receive a personal trip plan",
    description: "Review matched places, a daily itinerary and a clear budget breakdown.",
  },
] as const;

const features = [
  {
    title: "Personalized recommendations",
    description: "Hotels and activities are scored against your budget, preferences, location and interests.",
  },
  {
    title: "Day-by-day itinerary",
    description: "See activities, meals, travel time and estimated costs in one readable timeline.",
  },
  {
    title: "Smart budget overview",
    description: "Understand how accommodation, food, transport and activities fit within your total budget.",
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-6 px-4 md:px-6 xl:px-8">
          <Wordmark />
          <nav aria-label="Public" className="hidden items-center gap-6 md:flex">
            <Link href="#how-it-works" className="type-label text-muted-foreground hover:text-foreground">
              How it works
            </Link>
            <Link href="#features" className="type-label text-muted-foreground hover:text-foreground">
              Features
            </Link>
            <Link href="#example-trip" className="type-label text-muted-foreground hover:text-foreground">
              Example trip
            </Link>
          </nav>
          <Button asChild size="sm" variant="secondary">
            <Link href="/overview">Open app</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="border-b">
          <div className="mx-auto flex max-w-content flex-col gap-8 px-4 py-16 md:px-6 xl:px-8">
            <div className="flex max-w-prose flex-col gap-4">
              <p className="type-overline text-primary">Intelligent travel planning</p>
              <h1 className="type-title">Plan a trip around what matters to you.</h1>
              <p className="type-reading text-muted-foreground">
                Create a personalized travel plan shaped by your destination, dates, budget,
                travelers, hotel preferences, activities and travel style.
              </p>
            </div>

            <form action="/plan" method="get" className="flex max-w-form flex-col gap-2">
              <label htmlFor="destination" className="type-label">
                Where do you want to go?
              </label>
              <div className="flex flex-col gap-2 md:flex-row">
                <Input
                  id="destination"
                  name="destination"
                  placeholder="e.g. Barcelona"
                  autoComplete="off"
                  required
                  className="md:flex-1"
                />
                <Button type="submit" variant="primary" className="md:self-start">
                  Plan My Trip <ArrowRight aria-hidden />
                </Button>
              </div>
            </form>
          </div>
        </section>

        <section id="how-it-works" aria-labelledby="how-it-works-title">
          <div className="mx-auto flex max-w-content flex-col gap-8 px-4 py-12 md:px-6 md:py-16 xl:px-8">
            <div className="flex max-w-prose flex-col gap-1">
              <h2 id="how-it-works-title" className="type-title">How it works</h2>
              <p className="type-body text-muted-foreground">
                From a few practical choices to a plan you can review and refine.
              </p>
            </div>
            <ol className="grid gap-8 md:grid-cols-3">
              {steps.map((step, index) => (
                <li key={step.title} className="flex flex-col gap-2 border-t pt-4">
                  <span className="type-caption text-muted-foreground tabular">0{index + 1}</span>
                  <h3 className="type-subheading">{step.title}</h3>
                  <p className="type-body text-muted-foreground">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="features" aria-labelledby="features-title" className="bg-surface-subtle">
          <div className="mx-auto flex max-w-content flex-col gap-8 px-4 py-12 md:px-6 md:py-16 xl:px-8">
            <div className="flex max-w-prose flex-col gap-1">
              <h2 id="features-title" className="type-title">A practical plan, not more travel noise</h2>
              <p className="type-body text-muted-foreground">
                The current product foundation focuses on recommendations, itinerary structure and budget clarity.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {features.map((feature) => (
                <article key={feature.title} className="flex flex-col gap-2 border-t pt-4">
                  <h3 className="type-subheading">{feature.title}</h3>
                  <p className="type-body text-muted-foreground">{feature.description}</p>
                </article>
              ))}
            </div>
            <p className="max-w-prose type-caption text-muted-foreground">
              Planned next: route optimization, live map data and persistent saved trips.
            </p>
          </div>
        </section>

        <section id="example-trip" aria-labelledby="example-trip-title">
          <div className="mx-auto flex max-w-content flex-col gap-8 px-4 py-12 md:px-6 md:py-16 xl:px-8">
            <div className="flex max-w-prose flex-col gap-1">
              <h2 id="example-trip-title" className="type-title">A trip plan you can scan</h2>
              <p className="type-body text-muted-foreground">
                A realistic Barcelona example using the same trip patterns as the application workspace.
              </p>
            </div>

            <div className="flex flex-col gap-8 border-y bg-surface py-8">
              <TripHeader
                trip={trip}
                actions={
                  <Button asChild variant="secondary" size="sm">
                    <Link href="/trips/barcelona/itinerary">View full itinerary</Link>
                  </Button>
                }
              />
              <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                <div className="flex flex-col gap-2">
                  <p className="type-overline text-muted-foreground">Day 2</p>
                  <h3 className="type-heading">Tuesday, 13 July</h3>
                  <p className="type-body text-muted-foreground">
                    Architecture, local food and realistic travel time arranged into one day.
                  </p>
                </div>
                <ItineraryTimeline items={dayTwo} selectedId="i4" />
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="final-cta-title">
          <div className="mx-auto flex max-w-content flex-col items-start justify-between gap-6 border-t px-4 py-12 md:flex-row md:items-center md:px-6 xl:px-8">
            <div className="flex flex-col gap-1">
              <h2 id="final-cta-title" className="type-title">Ready to plan your next trip?</h2>
              <p className="type-body text-muted-foreground">Start with a destination and shape the details from there.</p>
            </div>
            <Button asChild variant="primary">
              <Link href="/plan">Start Planning <ArrowRight aria-hidden /></Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-content flex-col gap-4 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-6 xl:px-8">
          <Wordmark />
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="#how-it-works" className="type-caption text-muted-foreground hover:text-foreground">How it works</Link>
            <Link href="#features" className="type-caption text-muted-foreground hover:text-foreground">Features</Link>
            <Link href="/overview" className="type-caption text-muted-foreground hover:text-foreground">Open app</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
