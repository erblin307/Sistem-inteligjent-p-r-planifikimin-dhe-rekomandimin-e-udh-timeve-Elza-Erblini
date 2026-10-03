import { TripWorkspaceNav } from "@/components/shell/trip-workspace-nav";
import { TripHeader } from "@/components/travel/trip-header";
import { trip } from "@/lib/fixtures/barcelona";

export default async function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="bg-background px-4 pt-6 md:px-6 md:pt-8 xl:px-8">
        <div className="mx-auto max-w-wide pb-6">
          <TripHeader trip={trip} />
        </div>
      </div>
      <TripWorkspaceNav tripId={tripId} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
