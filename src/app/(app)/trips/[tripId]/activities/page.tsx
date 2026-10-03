import type { Metadata } from "next";

import { PageContainer } from "@/components/shell/app-shell";
import { ActivityRow } from "@/components/travel/activity-row";
import { SectionHeader } from "@/components/travel/page-header";
import { activities } from "@/lib/fixtures/barcelona";

export const metadata: Metadata = { title: "Barcelona activities" };

export default function ActivitiesPage() {
  return (
    <PageContainer className="flex flex-col gap-6">
      <SectionHeader title="Activities" description="Places matched to your interests and the time available." />
      <div className="divide-y border-y">
        {activities.map((activity) => <ActivityRow key={activity.id} activity={activity} />)}
      </div>
    </PageContainer>
  );
}
