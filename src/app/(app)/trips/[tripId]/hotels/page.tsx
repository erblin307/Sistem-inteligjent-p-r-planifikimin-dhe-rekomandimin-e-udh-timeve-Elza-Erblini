import type { Metadata } from "next";

import { PageContainer } from "@/components/shell/app-shell";
import { EmptyState } from "@/components/travel/empty-state";
import { HotelCard } from "@/components/travel/hotel-card";
import { SectionHeader } from "@/components/travel/page-header";
import { hotels as sampleHotels } from "@/lib/fixtures/barcelona";
import { loadRecommendations, loadWorkspace } from "../../data";
import { CatalogNote } from "../catalog-note";

export const metadata: Metadata = { title: "Hotels" };

export default async function HotelsPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const workspace = await loadWorkspace(tripId);
  const title = "Hotels";
  const description = "Options ranked for your budget, location and trip preferences.";

  if (workspace.kind !== "trip") {
    return (
      <PageContainer className="flex flex-col gap-6">
        <SectionHeader title={title} description={description} />
        <div className="flex flex-col gap-4">
          {sampleHotels.map((hotel, index) => (
            <HotelCard key={hotel.id} hotel={hotel} recommended={index === 0} selected={index === 0} />
          ))}
        </div>
      </PageContainer>
    );
  }

  const { hotels } = await loadRecommendations(workspace.trip);
  const eligible = hotels.filter((h) => h.eligible);

  return (
    <PageContainer className="flex flex-col gap-6">
      <SectionHeader title={title} description={description} />
      <CatalogNote sources={hotels.map((h) => h.source)} />
      {eligible.length === 0 ? (
        <EmptyState
          title="No hotels to recommend yet"
          description={`The catalog has no priced hotels in ${workspace.trip.destination.name} that match this trip.`}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {eligible.map((hotel, index) => (
            <HotelCard
              key={hotel.id}
              recommended={index === 0}
              selectable={false}
              imageSrc={hotel.imageUrl ?? undefined}
              hotel={{
                id: hotel.id,
                name: hotel.name,
                stars: hotel.stars as 1 | 2 | 3 | 4 | 5 | null,
                rating: hotel.rating,
                reviewCount: hotel.reviewCount,
                area: hotel.area,
                distanceToCentreM: hotel.distanceToCentreM,
                amenities: hotel.amenities,
                pricePerNight: hotel.nightlyPrice,
                nights: hotel.nights,
                rooms: hotel.rooms,
                freeCancellation: hotel.freeCancellation,
                score: hotel.score,
                reasons: [`${hotel.score}% match`, ...hotel.reasons],
              }}
            />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
