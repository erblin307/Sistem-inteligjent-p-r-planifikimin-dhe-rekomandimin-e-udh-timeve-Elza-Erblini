import type { Metadata } from "next";
import Link from "next/link";

import { PageContainer } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionHeader } from "@/components/travel/page-header";
import { TripListItem } from "@/components/travel/trip-list-item";
import { trip as sample } from "@/lib/fixtures/barcelona";
import { loadMyTrips, SAMPLE_TRIP_ID } from "../trips/data";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const trips = (await loadMyTrips()) ?? [];
  const today = new Date().toISOString().slice(0, 10);
  // Trips are sorted by start date, newest first; the next one is the last that hasn't ended.
  const upcoming = trips.filter((t) => t.endDate >= today).at(-1);

  return (
    <PageContainer className="flex flex-col gap-12">
      <PageHeader
        title="Overview"
        description="Pick up where you left off or start planning another trip."
        actions={
          <Button asChild variant="primary">
            <Link href="/plan">Plan a trip</Link>
          </Button>
        }
      />

      <section className="flex flex-col gap-4">
        <SectionHeader title={upcoming ? "Upcoming trip" : "Example trip"} />
        <div className="border-y">
          {upcoming ? (
            <TripListItem
              href={`/trips/${upcoming.id}/overview`}
              destination={upcoming.title ?? upcoming.destination.name}
              startDate={upcoming.startDate}
              endDate={upcoming.endDate}
              travelers={upcoming.travelers.total}
              budget={upcoming.budget}
            />
          ) : (
            <TripListItem
              href={`/trips/${SAMPLE_TRIP_ID}/overview`}
              destination={sample.destination}
              startDate={sample.startDate.toISOString().slice(0, 10)}
              endDate={sample.endDate.toISOString().slice(0, 10)}
              travelers={sample.adults + sample.children}
              budget={sample.budget}
              sample
            />
          )}
        </div>
      </section>
    </PageContainer>
  );
}
