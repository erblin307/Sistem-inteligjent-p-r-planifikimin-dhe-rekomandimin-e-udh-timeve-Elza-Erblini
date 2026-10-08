import * as React from "react";
import { CalendarDays, Users, Wallet } from "lucide-react";

import { formatDateRange, formatMoney, plural } from "@/lib/format";
import type { TripSummary } from "@/lib/fixtures/barcelona";
import { Badge } from "@/components/ui/badge";
import { MetaItem, MetaList } from "./meta";

/**
 * Workspace header. Destination is the title; dates, party and budget are the
 * facts every tab depends on, so they stay visible above the tabs.
 */
function TripHeader({
  trip,
  actions,
  sample = false,
}: {
  trip: TripSummary;
  actions?: React.ReactNode;
  /** Marks fixture data so it is never mistaken for the user's own trip. */
  sample?: boolean;
}) {
  const travelers = trip.adults + trip.children;
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="type-title">{trip.destination}</h1>
          {trip.status === "draft" ? <Badge variant="outline">Draft</Badge> : null}
          {sample ? <Badge variant="outline">Sample data</Badge> : null}
        </div>
        <MetaList
          items={[
            <MetaItem key="d" icon={<CalendarDays />}>
              {formatDateRange(trip.startDate, trip.endDate)}
            </MetaItem>,
            <MetaItem key="t" icon={<Users />}>
              {plural(travelers, "traveler")}
            </MetaItem>,
            <MetaItem key="b" icon={<Wallet />}>
              <span className="tabular">{formatMoney(trip.budget)}</span>&nbsp;budget
            </MetaItem>,
          ]}
        />
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export { TripHeader };
