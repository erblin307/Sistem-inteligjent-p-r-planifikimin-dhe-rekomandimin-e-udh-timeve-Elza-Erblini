import type { Metadata } from "next";

import { PageContainer } from "@/components/shell/app-shell";
import { BudgetSummary, BudgetTable } from "@/components/travel/budget-breakdown";
import { SectionHeader } from "@/components/travel/page-header";
import { budgetLines, trip } from "@/lib/fixtures/barcelona";
import { loadWorkspace } from "../../data";
import { NotPlannedYet } from "../not-planned";

export const metadata: Metadata = { title: "Budget" };

export default async function BudgetPage({ params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  const workspace = await loadWorkspace(tripId);
  if (workspace.kind === "trip") {
    return (
      <NotPlannedYet
        tripId={tripId}
        title="No budget breakdown yet"
        description="The breakdown is built from the itinerary and chosen hotel, and this trip has neither yet. Hotel and activity rankings already use your budget."
      />
    );
  }

  return (
    <PageContainer className="flex flex-col gap-8">
      <SectionHeader title="Budget" description="Planned costs against your €1,500 total budget." />
      <BudgetSummary total={trip.budget} lines={budgetLines} />
      <BudgetTable total={trip.budget} lines={budgetLines} />
    </PageContainer>
  );
}
