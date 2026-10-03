import type { Metadata } from "next";

import { PageContainer } from "@/components/shell/app-shell";
import { HotelCard } from "@/components/travel/hotel-card";
import { SectionHeader } from "@/components/travel/page-header";
import { hotels } from "@/lib/fixtures/barcelona";

export const metadata: Metadata = { title: "Barcelona hotels" };

export default function HotelsPage() {
  return (
    <PageContainer className="flex flex-col gap-6">
      <SectionHeader title="Hotels" description="Options ranked for your budget, location and trip preferences." />
      <div className="flex flex-col gap-4">
        {hotels.map((hotel, index) => (
          <HotelCard key={hotel.id} hotel={hotel} recommended={index === 0} selected={index === 0} />
        ))}
      </div>
    </PageContainer>
  );
}
