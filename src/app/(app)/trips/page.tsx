import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Users } from "lucide-react";

import { PageContainer } from "@/components/shell/app-shell";
import { Button } from "@/components/ui/button";
import { MetaItem, MetaList } from "@/components/travel/meta";
import { PageHeader } from "@/components/travel/page-header";

export const metadata: Metadata = { title: "My trips" };

export default function TripsPage() {
  return (
    <PageContainer className="flex flex-col gap-12">
      <PageHeader title="My trips" description="View and continue your planned journeys." />
      <article className="flex flex-col gap-6 border-y py-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="type-heading">Barcelona</h2>
          <MetaList
            items={[
              <MetaItem key="dates" icon={<CalendarDays />}>12–17 July</MetaItem>,
              <MetaItem key="travelers" icon={<Users />}>2 travelers</MetaItem>,
            ]}
          />
        </div>
        <Button asChild variant="secondary">
          <Link href="/trips/barcelona/overview">Open trip <ArrowRight aria-hidden /></Link>
        </Button>
      </article>
    </PageContainer>
  );
}
