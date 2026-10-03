import type { Metadata } from "next";

import { PageContainer } from "@/components/shell/app-shell";
import { PageHeader } from "@/components/travel/page-header";
import { TripPlanner } from "@/components/travel/trip-planner";

export const metadata: Metadata = { title: "Plan a trip" };

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialDestination = Array.isArray(params.destination)
    ? (params.destination[0] ?? "")
    : (params.destination ?? "");

  return (
    <PageContainer width="content" className="flex flex-col gap-12">
      <PageHeader
        title="Plan a trip"
        description="Tell us where you want to go, when you are traveling and what matters to you."
      />
      <TripPlanner initialDestination={initialDestination} />
    </PageContainer>
  );
}
