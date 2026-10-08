import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/travel/empty-state";
import { PageHeader, SectionHeader } from "@/components/travel/page-header";
import { TripListItem } from "@/components/travel/trip-list-item";
import { trip as sample } from "@/lib/fixtures/barcelona";
import { loadMyTrips, SAMPLE_TRIP_ID } from "./data";

export const metadata: Metadata = { title: "My trips" };

export default async function TripsPage() {
  const trips = await loadMyTrips();

  return (
    <PageContainer className="flex flex-col gap-12">
      <PageHeader
        title="My trips"
        description="View and continue your planned journeys."
        actions={
          <Button asChild variant="primary">
            <Link href="/plan">Plan a trip</Link>
          </Button>
        }
      />

      {trips && trips.length > 0 ? (
        <div className="divide-y border-y">
          {trips.map((t) => (
            <TripListItem
              key={t.id}
              href={`/trips/${t.id}/overview`}
              destination={t.title ?? t.destination.name}
              startDate={t.startDate}
              endDate={t.endDate}
              travelers={t.travelers.total}
              budget={t.budget}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No saved trips yet"
          description={
            trips
              ? "Trips you create in Plan a trip are saved and listed here."
              : "Saved trips could not be loaded. Check the database connection and DEV_AUTH_EMAIL."
          }
          action={
            <Button asChild variant="secondary">
              <Link href="/plan">Plan a trip</Link>
            </Button>
          }
        />
      )}

      <section className="flex flex-col gap-4">
        <SectionHeader title="Example trip" description="A finished plan with sample data, to show what a full workspace looks like." />
        <div className="border-y">
          <TripListItem
            href={`/trips/${SAMPLE_TRIP_ID}/overview`}
            destination={sample.destination}
            startDate={sample.startDate.toISOString().slice(0, 10)}
            endDate={sample.endDate.toISOString().slice(0, 10)}
            travelers={sample.adults + sample.children}
            budget={sample.budget}
            sample
          />
        </div>
      </section>
    </PageContainer>
  );
}
