import type { Metadata } from "next";

import { PageContainer } from "@/components/shell/app-shell";
import { BudgetSummary, BudgetTable } from "@/components/travel/budget-breakdown";
import { SectionHeader } from "@/components/travel/page-header";
import { budgetLines, trip } from "@/lib/fixtures/barcelona";

export const metadata: Metadata = { title: "Barcelona budget" };

export default function BudgetPage() {
  return (
    <PageContainer className="flex flex-col gap-8">
      <SectionHeader title="Budget" description="Planned costs against your €1,500 total budget." />
      <BudgetSummary total={trip.budget} lines={budgetLines} />
      <BudgetTable total={trip.budget} lines={budgetLines} />
    </PageContainer>
  );
}
