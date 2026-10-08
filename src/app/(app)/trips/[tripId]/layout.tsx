import { notFound } from "next/navigation";

import { TripWorkspaceNav } from "@/components/shell/trip-workspace-nav";
import { TripHeader } from "@/components/travel/trip-header";
import { trip } from "@/lib/fixtures/barcelona";

/** The workspace only has the Barcelona fixture until trips are loaded from the trips API. */
const FIXTURE_TRIP_ID = "barcelona";

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  if (tripId !== FIXTURE_TRIP_ID) notFound();

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="bg-background px-4 pt-6 md:px-6 md:pt-8 xl:px-8">
        <div className="mx-auto flex max-w-wide flex-col gap-2 pb-6">
          <TripHeader trip={trip} sample />
          <p className="type-body text-muted-foreground">
            Example plan with sample data. Trips created in Plan a trip are not saved to this
            workspace yet.
          </p>
        </div>
      </div>
      <TripWorkspaceNav tripId={tripId} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
