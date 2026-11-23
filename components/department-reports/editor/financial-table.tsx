/**
 * The financial statement table, in the PDF's order (02_CONTRACTS.md § Rules:
 * "Money table in exports"). Shared by the editor's Financial step and the
 * report preview. Amounts are read-only; the editor may render a note input
 * under each line through `renderLineNote`.
 */

import type { ReactNode } from "react";

import { formatKes } from "@/lib/receipts/format";
import type { FinancialLine, FinancialStatement } from "@/lib/department-reports/types";
import { cn } from "@/lib/utils";

interface FinancialTableProps {
  statement: FinancialStatement;
  /** Editor: an input per line. Otherwise the saved note is shown as text. */
  renderLineNote?: (line: FinancialLine) => ReactNode;
  caption?: string;
  className?: string;
}

function TotalRow({ testId, label, amount, strong }: { testId: string; label: string; amount: string; strong?: boolean }) {
  return (
    <tr data-testid={testId} className={cn("border-t", strong && "bg-muted/50")}>
      <th scope="row" className="p-2 text-left font-semibold">
        {label}
      </th>
      <td className="p-2 text-right font-semibold tabular-nums whitespace-nowrap">{formatKes(amount)}</td>
    </tr>
  );
}

function HeadingRow({ label }: { label: string }) {
  return (
    <tr className="border-t">
      <th scope="rowgroup" colSpan={2} className="p-2 pt-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </th>
    </tr>
  );
}

function LineRows({
  lines,
  emptyLabel,
  renderLineNote,
}: {
  lines: FinancialLine[];
  emptyLabel: string;
  renderLineNote?: (line: FinancialLine) => ReactNode;
}) {
  if (lines.length === 0) {
    return (
      <tr>
        <td colSpan={2} className="px-2 pb-2 pl-5 text-sm text-muted-foreground">
          {emptyLabel}
        </td>
      </tr>
    );
  }
  return (
    <>
      {lines.map((line) => (
        <tr key={`${line.direction}:${line.label}`} data-testid="financial-line">
          <td className="px-2 py-1.5 pl-5 align-top">
            <span className="break-words">{line.label}</span>
            {renderLineNote ? (
              <div className="mt-1.5">{renderLineNote(line)}</div>
            ) : line.note ? (
              <p className="mt-0.5 text-xs text-muted-foreground break-words">{line.note}</p>
            ) : null}
          </td>
          <td className="px-2 py-1.5 text-right align-top tabular-nums whitespace-nowrap">{formatKes(line.amount)}</td>
        </tr>
      ))}
    </>
  );
}

export function FinancialTable({ statement, renderLineNote, caption, className }: FinancialTableProps) {
  const moneyIn = statement.lines.filter((l) => l.direction === "in");
  const moneyOut = statement.lines.filter((l) => l.direction === "out");
  return (
    <div className={cn("rounded-lg border", className)}>
      <table className="w-full table-fixed text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <colgroup>
          <col />
          <col className="w-32 sm:w-40" />
        </colgroup>
        <thead className="sr-only">
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr data-testid="financial-row-brought-forward">
            <th scope="row" className="p-2 text-left font-semibold">
              Balance brought forward
            </th>
            <td className="p-2 text-right font-semibold tabular-nums whitespace-nowrap">
              {formatKes(statement.broughtForward)}
            </td>
          </tr>
          <HeadingRow label="Money in" />
          <LineRows lines={moneyIn} emptyLabel="No money in this period" renderLineNote={renderLineNote} />
          <TotalRow testId="financial-row-money-in" label="Total money in" amount={statement.moneyIn} />
          <HeadingRow label="Money out" />
          <LineRows lines={moneyOut} emptyLabel="No money out this period" renderLineNote={renderLineNote} />
          <TotalRow testId="financial-row-money-out" label="Total money out" amount={statement.moneyOut} />
          <TotalRow
            testId="financial-row-carried-forward"
            label="Balance carried forward"
            amount={statement.carriedForward}
            strong
          />
        </tbody>
      </table>
    </div>
  );
}
