import Link from "next/link";

import { PageContainer } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/travel/empty-state";

/**
 * Shown on tabs that need a generated plan (itinerary, map, budget) for saved
 * trips. Plan generation is not built yet; the sample trip shows what it will
 * look like.
 */
export function NotPlannedYet({ tripId, title, description }: { tripId: string; title: string; description: string }) {
  return (
    <PageContainer className="flex flex-col gap-6">
      <EmptyState
        title={title}
        description={description}
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary">
              <Link href={`/trips/${tripId}/activities`}>Review recommended activities</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/trips/barcelona/itinerary">See the sample plan</Link>
            </Button>
          </div>
        }
      />
    </PageContainer>
  );
}
