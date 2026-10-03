import type { Metadata } from "next";

import { MapCanvas } from "@/components/travel/map-canvas";

export const metadata: Metadata = { title: "Barcelona map" };

export default function MapPage() {
  return (
    <section aria-label="Trip map" className="mx-auto min-h-[calc(100dvh-220px)] max-w-wide md:p-6 xl:p-8">
      <div className="size-full min-h-[calc(100dvh-220px)] overflow-hidden md:rounded-lg md:border">
        <MapCanvas label="Barcelona itinerary with the hotel and three planned stops" />
      </div>
    </section>
  );
}
