import type { Metadata } from "next";

import { MapCanvas } from "@/components/travel/map-canvas";
import { loadWorkspace } from "../../data";
import { NotPlannedYet } from "../not-planned";

export const metadata: Metadata = { title: "Map" };

export default async function MapPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const workspace = await loadWorkspace(tripId);
  if (workspace.kind === "trip") {
    return (
      <NotPlannedYet
        tripId={tripId}
        title="Nothing to map yet"
        description="The map shows itinerary stops, and this trip has no itinerary yet. An interactive map is planned."
      />
    );
  }

  return (
    <section aria-label="Trip map" className="mx-auto min-h-[calc(100dvh-220px)] max-w-wide md:p-6 xl:p-8">
      <div className="size-full min-h-[calc(100dvh-220px)] overflow-hidden md:rounded-lg md:border">
        <MapCanvas label="Barcelona itinerary with the hotel and three planned stops" />
      </div>
    </section>
  );
}
