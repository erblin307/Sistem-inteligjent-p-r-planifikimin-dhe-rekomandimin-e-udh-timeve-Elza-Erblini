import { notFound } from "next/navigation";

import { PageContainer } from "@/components/shell/app-shell";
import { TripWorkspaceNav } from "@/components/shell/trip-workspace-nav";
import { EmptyState } from "@/components/travel/empty-state";
import { TripHeader } from "@/components/travel/trip-header";
import { trip as sampleTrip } from "@/lib/fixtures/barcelona";
import { loadWorkspace, toTripSummary } from "../data";

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const workspace = await loadWorkspace(tripId);
  if (workspace.kind === "not-found") notFound();
  if (workspace.kind === "signed-out") {
    return (
      <PageContainer>
        <EmptyState
          title="Sign in to open this trip"
          description="Saved trips belong to a signed-in user. Sign-in is not available yet; in development, set DEV_AUTH_EMAIL in .env.local."
        />
      </PageContainer>
    );
  }

  const sample = workspace.kind === "sample";

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="bg-background px-4 pt-6 md:px-6 md:pt-8 xl:px-8">
        <div className="mx-auto flex max-w-wide flex-col gap-2 pb-6">
          <TripHeader trip={sample ? sampleTrip : toTripSummary(workspace.trip)} sample={sample} />
          {sample ? (
            <p className="type-body text-muted-foreground">
              Example plan with sample data. Trips you create in Plan a trip open in their own
              workspace.
            </p>
          ) : null}
        </div>
      </div>
      <TripWorkspaceNav tripId={tripId} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
