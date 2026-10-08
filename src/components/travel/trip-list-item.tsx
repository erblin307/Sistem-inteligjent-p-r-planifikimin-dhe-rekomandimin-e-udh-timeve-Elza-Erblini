import * as React from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Users, Wallet } from "lucide-react";

import type { Money } from "@/lib/format";
import { formatDateRange, formatMoney, plural } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetaItem, MetaList } from "./meta";

/** One trip in a list: destination, dates, party, budget and an Open action. */
function TripListItem({
  href,
  destination,
  startDate,
  endDate,
  travelers,
  budget,
  sample = false,
}: {
  href: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: number;
  budget: Money;
  sample?: boolean;
}) {
  return (
    <article className="flex flex-col gap-6 py-6 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-center gap-2">
          <h2 className="type-heading">{destination}</h2>
          {sample ? <Badge variant="outline">Sample data</Badge> : null}
        </div>
        <MetaList
          items={[
            <MetaItem key="dates" icon={<CalendarDays />}>
              {formatDateRange(new Date(`${startDate}T00:00:00Z`), new Date(`${endDate}T00:00:00Z`))}
            </MetaItem>,
            <MetaItem key="travelers" icon={<Users />}>
              {plural(travelers, "traveler")}
            </MetaItem>,
            <MetaItem key="budget" icon={<Wallet />}>
              <span className="tabular">{formatMoney(budget)}</span>&nbsp;budget
            </MetaItem>,
          ]}
        />
      </div>
      <Button asChild variant="secondary">
        <Link href={href}>
          Open trip <ArrowRight aria-hidden />
        </Link>
      </Button>
    </article>
  );
}

export { TripListItem };
