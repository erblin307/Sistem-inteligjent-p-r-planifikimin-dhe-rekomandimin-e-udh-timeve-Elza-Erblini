import type { Metadata } from "next";

import { PageContainer } from "@/components/shell/app-shell";
import { EmptyState } from "@/components/travel/empty-state";
import { PageHeader } from "@/components/travel/page-header";
import { TripPlanner } from "@/components/travel/trip-planner";
import { getDb } from "@/server/db/client";
import { listInterests, searchDestinations } from "@/server/modules/destinations";

export const metadata: Metadata = { title: "Plan a trip" };

async function loadCatalog() {
  try {
    const db = getDb();
    const [destinations, interests] = await Promise.all([
      searchDestinations({ db }, { limit: 50 }),
      listInterests({ db }),
    ]);
    return {
      destinations: destinations.items.map((d) => ({ id: d.id, name: d.name, countryCode: d.countryCode })),
      interests,
    };
  } catch (error) {
    console.error("Plan page could not load the catalog", error);
    return null;
  }
}

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string | string[] }>;
}) {
  const params = await searchParams;
  const requested = (Array.isArray(params.destination) ? params.destination[0] : params.destination) ?? "";
  const catalog = await loadCatalog();

  const wanted = requested.trim().toLowerCase();
  const initialDestinationId =
    catalog?.destinations.find((d) => wanted && (d.name.toLowerCase() === wanted || d.id === requested))?.id ??
    "";

  return (
    <PageContainer width="content" className="flex flex-col gap-12">
      <PageHeader
        title="Plan a trip"
        description="Tell us where you want to go, when you are traveling and what matters to you."
      />
      {catalog && catalog.destinations.length > 0 ? (
        <TripPlanner
          destinations={catalog.destinations}
          interests={catalog.interests}
          initialDestinationId={initialDestinationId}
        />
      ) : (
        <EmptyState
          title="The destination catalog is not available"
          description={
            catalog
              ? "There are no destinations yet. Run pnpm db:seed to load the development catalog."
              : "The database could not be reached. Check DATABASE_URL, then run pnpm db:migrate and pnpm db:seed."
          }
        />
      )}
    </PageContainer>
  );
}
