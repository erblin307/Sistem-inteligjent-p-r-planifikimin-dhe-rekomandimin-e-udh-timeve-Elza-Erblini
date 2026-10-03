import * as React from "react";

import { formatMoney, type Money } from "@/lib/format";
import type { BudgetLine } from "@/lib/fixtures/barcelona";
import { cn } from "@/lib/utils";
import { Meter } from "@/components/ui/meter";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Budget summary: three figures that answer "can we afford this?", then a
 * plain breakdown table. No chart – six rows read faster as numbers.
 */
function BudgetSummary({ total, lines }: { total: Money; lines: BudgetLine[] }) {
  const spend = lines.filter((l) => l.category !== "Reserve");
  const reserve = lines.find((l) => l.category === "Reserve");
  const planned = sum(spend.map((l) => l.planned), total.currency);
  const committed = planned.amountMinor + (reserve?.planned.amountMinor ?? 0);
  const remaining = { amountMinor: total.amountMinor - committed, currency: total.currency };
  const over = remaining.amountMinor < 0;

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-3 divide-x border-y py-4">
        <Figure label="Total budget" value={formatMoney(total)} />
        <Figure label="Planned spend" value={formatMoney(planned)} className="pl-4 md:pl-6" />
        <Figure
          label="Remaining"
          value={formatMoney(remaining)}
          tone={over ? "danger" : "default"}
          className="pl-4 md:pl-6"
          note={reserve ? `after ${formatMoney(reserve.planned)} reserve` : undefined}
        />
      </dl>
      <Meter
        value={committed}
        max={total.amountMinor}
        label="Share of budget planned"
        tone={over ? "danger" : "brand"}
      />
    </div>
  );
}

function Figure({
  label,
  value,
  note,
  tone = "default",
  className,
}: {
  label: string;
  value: string;
  note?: string | undefined;
  tone?: "default" | "danger";
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <dt className="type-caption text-muted-foreground">{label}</dt>
      <dd className={cn("type-figure", tone === "danger" && "text-destructive")}>{value}</dd>
      {note ? <dd className="type-caption text-muted-foreground">{note}</dd> : null}
    </div>
  );
}

function BudgetTable({ total, lines }: { total: Money; lines: BudgetLine[] }) {
  const allocated = sum(lines.map((l) => l.planned), total.currency);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead className="hidden md:table-cell">Based on</TableHead>
          <TableHead numeric>Share</TableHead>
          <TableHead numeric>Planned</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((line) => {
          const share = Math.round((line.planned.amountMinor / total.amountMinor) * 100);
          return (
            <TableRow key={line.category}>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="type-label">{line.category}</span>
                  <span className="type-caption text-muted-foreground md:hidden">{line.basis}</span>
                </div>
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">{line.basis}</TableCell>
              <TableCell numeric className="w-32">
                <div className="flex items-center justify-end gap-2">
                  <Meter
                    value={share}
                    max={100}
                    label={`${line.category} share`}
                    tone={line.category === "Reserve" ? "neutral" : "brand"}
                    className="hidden w-16 md:block"
                  />
                  <span className="w-10 text-muted-foreground">{share}%</span>
                </div>
              </TableCell>
              <TableCell numeric className="type-label">
                {formatMoney(line.planned)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Allocated</TableCell>
          <TableCell className="hidden md:table-cell" />
          <TableCell numeric className="text-muted-foreground">
            {Math.round((allocated.amountMinor / total.amountMinor) * 100)}%
          </TableCell>
          <TableCell numeric>{formatMoney(allocated)}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

function sum(values: Money[], currency: string): Money {
  return { amountMinor: values.reduce((acc, v) => acc + v.amountMinor, 0), currency };
}

export { BudgetSummary, BudgetTable };
