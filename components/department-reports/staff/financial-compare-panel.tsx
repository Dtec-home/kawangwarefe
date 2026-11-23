"use client";

/**
 * "Books today vs submitted" (DR-8, US-15): the figures frozen when the leader
 * submitted, next to what the treasurer's books say now. Collapsible; opens
 * by itself when a late entry changed something.
 */

import { useId, useState } from "react";
import { ChevronDown, Scale, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatKes, formatNairobiDateTime } from "@/lib/receipts/format";
import type { FinancialStatement } from "@/lib/department-reports/types";
import { compareStatements } from "@/components/department-reports/staff/financial-compare";

interface FinancialComparePanelProps {
  submitted: FinancialStatement;
  today: FinancialStatement;
}

function signedKes(difference: string): string {
  const value = Number.parseFloat(difference);
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatKes(Math.abs(value))}`;
}

export function FinancialComparePanel({ submitted, today }: FinancialComparePanelProps) {
  const rows = compareStatements(submitted, today);
  const differs = rows.some((row) => row.changed);
  const [open, setOpen] = useState(differs);
  const contentId = useId();

  return (
    <section
      data-testid="dept-report-live-financial"
      className={cn(
        "w-full rounded-xl border bg-card shadow-sm",
        differs ? "border-warning/50" : "border-border",
      )}
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Scale className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="font-semibold">Books today vs submitted</span>
          {differs ? (
            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">Changed</span>
          ) : null}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div id={contentId} className="space-y-3 border-t border-border px-4 py-3">
          {differs ? (
            <p role="status" className="flex items-start gap-2 text-sm text-warning">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              A late entry changed the figures after submission. The report keeps the submitted figures.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">The books still match the submitted figures.</p>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Submitted figures compared with the books today</caption>
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th scope="col" className="py-1.5 pr-3 font-medium">Line</th>
                  <th scope="col" className="py-1.5 pr-3 text-right font-medium">Submitted</th>
                  <th scope="col" className="py-1.5 pr-3 text-right font-medium">Books today</th>
                  <th scope="col" className="py-1.5 text-right font-medium">Difference</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.key}
                    data-testid={`live-financial-${row.key}`}
                    data-changed={row.changed ? "true" : "false"}
                    className={cn("border-t border-border", row.changed && "bg-warning/10 font-medium")}
                  >
                    <th scope="row" className="py-1.5 pr-3 text-left font-normal">{row.label}</th>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{formatKes(row.submitted)}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{formatKes(row.today)}</td>
                    <td className={cn("py-1.5 text-right tabular-nums", row.changed ? "text-warning" : "text-muted-foreground")}>
                      {row.changed ? signedKes(row.difference) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Submitted figures as of {formatNairobiDateTime(submitted.asOf)}; books read at{" "}
            {formatNairobiDateTime(today.asOf)}.
          </p>
        </div>
      ) : null}
    </section>
  );
}
