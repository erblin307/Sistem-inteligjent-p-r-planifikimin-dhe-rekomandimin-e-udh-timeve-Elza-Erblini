import type { Metadata } from "next";

import { PageContainer } from "@/components/shell/app-shell";
import { ActivityRow } from "@/components/travel/activity-row";
import { EmptyState } from "@/components/travel/empty-state";
import { SectionHeader } from "@/components/travel/page-header";
import { activities as sampleActivities } from "@/lib/fixtures/barcelona";
import { loadRecommendations, loadWorkspace } from "../../data";
import { CatalogNote } from "../catalog-note";

export const metadata: Metadata = { title: "Activities" };

export default async function ActivitiesPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const workspace = await loadWorkspace(tripId);
  const title = "Activities";
  const description = "Places matched to your interests and the time available.";

  if (workspace.kind !== "trip") {
    return (
      <PageContainer className="flex flex-col gap-6">
        <SectionHeader title={title} description={description} />
        <div className="divide-y border-y">
          {sampleActivities.map((activity) => <ActivityRow key={activity.id} activity={activity} />)}
        </div>
      </PageContainer>
    );
  }

  const { activities } = await loadRecommendations(workspace.trip);
  const eligible = activities.filter((a) => a.eligible);
  const excluded = activities.filter((a) => !a.eligible);

  return (
    <PageContainer className="flex flex-col gap-6">
      <SectionHeader title={title} description={description} />
      <CatalogNote sources={activities.map((a) => a.source)} />
      {eligible.length === 0 ? (
        <EmptyState
          title="No activities to recommend yet"
          description={`The catalog has no priced activities in ${workspace.trip.destination.name} that fit this trip.`}
        />
      ) : (
        <div className="divide-y border-y">
          {eligible.map((activity) => (
            <ActivityRow
              key={activity.id}
              distanceFrom="centre"
              addable={false}
              image={activity.image}
              activity={{
                id: activity.id,
                title: activity.name,
                category: activity.category.name,
                rating: activity.rating,
                reviewCount: activity.reviewCount,
                durationMin: activity.durationMinutes,
                price: activity.pricePerPerson.amountMinor === 0 ? null : activity.pricePerPerson,
                distanceM: activity.distanceToCentreM,
                score: activity.score,
                reason: [`${activity.score}% match`, ...activity.reasons].join(" · "),
              }}
            />
          ))}
        </div>
      )}
      {excluded.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="type-label">Not suitable for this trip</h3>
          <ul className="flex flex-col gap-1 type-body text-muted-foreground">
            {excluded.map((a) => (
              <li key={a.id}>
                <span className="text-foreground">{a.name}</span>: {a.reasons[0]}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </PageContainer>
  );
}
