import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, CalendarRange } from "lucide-react";

import { PageContainer } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/travel/page-header";
import { TripBrief } from "@/components/travel/trip-brief";
import { loadWorkspace } from "../../data";

export const metadata: Metadata = { title: "Trip overview" };

export default async function TripOverviewPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const workspace = await loadWorkspace(tripId);

  if (workspace.kind === "trip") {
    return (
      <PageContainer width="wide" className="flex flex-col gap-12">
        <section className="flex flex-col gap-4">
          <SectionHeader title="Trip brief" description="What this trip is planned around." />
          <TripBrief trip={workspace.trip} />
        </section>
        <section className="flex flex-col gap-4">
          <SectionHeader title="Next steps" />
          <div className="divide-y border-y">
            <div className="grid gap-4 py-6 md:grid-cols-[32px_minmax(0,1fr)_auto] md:items-center">
              <Building2 aria-hidden className="hidden size-5 text-subtle-foreground md:block" />
              <div>
                <p className="type-label">Hotels ranked for this trip</p>
                <p className="type-body text-muted-foreground">Scored against your budget, preferences and interests</p>
              </div>
              <Button asChild variant="link" size="sm">
                <Link href={`/trips/${tripId}/hotels`}>Review hotels <ArrowRight aria-hidden /></Link>
              </Button>
            </div>
            <div className="grid gap-4 py-6 md:grid-cols-[32px_minmax(0,1fr)_auto] md:items-center">
              <CalendarRange aria-hidden className="hidden size-5 text-subtle-foreground md:block" />
              <div>
                <p className="type-label">Activities matched to your interests</p>
                <p className="type-body text-muted-foreground">Ranked by fit, price, distance and rating</p>
              </div>
              <Button asChild variant="link" size="sm">
                <Link href={`/trips/${tripId}/activities`}>Review activities <ArrowRight aria-hidden /></Link>
              </Button>
            </div>
          </div>
        </section>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="wide" className="flex flex-col gap-12">
      <section className="flex flex-col gap-4">
        <SectionHeader
          title="Your plan"
          description="The essential choices for this trip, kept in one place."
        />
        <div className="divide-y border-y">
          <div className="grid gap-4 py-6 md:grid-cols-[32px_minmax(0,1fr)_auto] md:items-center">
            <Building2 aria-hidden className="hidden size-5 text-subtle-foreground md:block" />
            <div>
              <p className="type-label">Hotel Casa Fuster</p>
              <p className="type-body text-muted-foreground">Gràcia · 5 nights · €142 per night</p>
            </div>
            <Button asChild variant="link" size="sm">
              <Link href={`/trips/${tripId}/hotels`}>Review hotel <ArrowRight aria-hidden /></Link>
            </Button>
          </div>
          <div className="grid gap-4 py-6 md:grid-cols-[32px_minmax(0,1fr)_auto] md:items-center">
            <CalendarRange aria-hidden className="hidden size-5 text-subtle-foreground md:block" />
            <div>
              <p className="type-label">Six-day itinerary</p>
              <p className="type-body text-muted-foreground">Activities, meals and travel time arranged day by day</p>
            </div>
            <Button asChild variant="link" size="sm">
              <Link href={`/trips/${tripId}/itinerary`}>View itinerary <ArrowRight aria-hidden /></Link>
            </Button>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
