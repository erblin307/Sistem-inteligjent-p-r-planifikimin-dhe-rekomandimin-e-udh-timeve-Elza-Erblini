import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Users, Wallet } from "lucide-react";

import { PageContainer } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { MetaItem, MetaList } from "@/components/travel/meta";
import { PageHeader, SectionHeader } from "@/components/travel/page-header";

export const metadata: Metadata = { title: "Overview" };

export default function OverviewPage() {
  return (
    <PageContainer className="flex flex-col gap-12">
      <PageHeader
        title="Overview"
        description="Pick up where you left off or start planning another trip."
        actions={
          <Button asChild variant="primary">
            <Link href="/plan">Plan a trip</Link>
          </Button>
        }
      />

      <section className="flex flex-col gap-4">
        <SectionHeader title="Upcoming trip" />
        <article className="flex flex-col gap-6 border-y py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <div>
              <p className="type-caption text-muted-foreground">Spain</p>
              <h2 className="type-heading">Barcelona</h2>
            </div>
            <MetaList
              items={[
                <MetaItem key="dates" icon={<CalendarDays />}>
                  12–17 July
                </MetaItem>,
                <MetaItem key="travelers" icon={<Users />}>
                  2 travelers
                </MetaItem>,
                <MetaItem key="budget" icon={<Wallet />}>
                  <span className="tabular">€1,500</span>&nbsp;budget
                </MetaItem>,
              ]}
            />
          </div>
          <Button asChild variant="secondary">
            <Link href="/trips/barcelona/overview">
              Open trip <ArrowRight aria-hidden />
            </Link>
          </Button>
        </article>
      </section>
    </PageContainer>
  );
}
