"use client";

/**
 * Cash Statement columns preview (T3.1): the fund columns the statement will
 * print for a date range, in order, grouped into trust and local funds.
 * Shared by the Categories page and the Reports → Exports Cash Statement card.
 */

import { useQuery } from "@apollo/client/react";
import { AlertCircle, AlertTriangle, Columns3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty } from "@/components/ui/empty";
import {
  GET_STATEMENT_COLUMNS,
  type StatementColumn,
  type StatementColumnsData,
} from "@/lib/graphql/treasury-queries";
import { mostRecentSaturday } from "@/lib/treasury/cash-statement";
import { formatEntryDate } from "@/lib/treasury/entry-dates";

/** Split columns into trust and local groups, keeping the server's order. */
export function groupStatementColumns(columns: StatementColumn[]): {
  trust: StatementColumn[];
  local: StatementColumn[];
} {
  return {
    trust: columns.filter((c) => c.isTrust),
    local: columns.filter((c) => !c.isTrust),
  };
}

function ColumnGroup({
  title,
  columns,
  startIndex,
  tone,
}: {
  title: string;
  columns: StatementColumn[];
  startIndex: number;
  tone: "trust" | "local";
}) {
  return (
    <section aria-label={title} className="space-y-2">
      <h3 className="text-sm font-medium">
        {title} <span className="text-muted-foreground">({columns.length})</span>
      </h3>
      {columns.length === 0 ? (
        <p className="text-xs text-muted-foreground">None</p>
      ) : (
        <ol className="flex flex-wrap gap-2">
          {columns.map((column, i) => (
            <li
              key={column.key}
              className={
                tone === "trust"
                  ? "inline-flex items-center gap-1.5 rounded-full bg-info/12 px-2.5 py-1 text-xs font-medium text-info"
                  : "inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground"
              }
            >
              <span className="tabular-nums opacity-70">{startIndex + i + 1}.</span>
              {column.label}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export interface StatementColumnsPreviewProps {
  /** ISO date; defaults to the most recent Saturday in Nairobi. */
  dateFrom?: string;
  /** ISO date; defaults to dateFrom. */
  dateTo?: string;
}

/** The preview body: fetches and renders the ordered column chips. */
export function StatementColumnsPreview({ dateFrom, dateTo }: StatementColumnsPreviewProps) {
  const from = dateFrom || mostRecentSaturday();
  const to = dateTo || from;
  const { data, loading, error } = useQuery<StatementColumnsData>(GET_STATEMENT_COLUMNS, {
    variables: { dateFrom: from, dateTo: to },
    fetchPolicy: "network-only",
  });

  const period = from === to ? formatEntryDate(from) : `${formatEntryDate(from)} – ${formatEntryDate(to)}`;

  if (loading) {
    return (
      <div className="space-y-3" data-testid="statement-columns-loading">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Could not load the columns</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  const columns = data?.statementColumns ?? [];
  const { trust, local } = groupStatementColumns(columns);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Columns for {period}, in print order.</p>
      {columns.length === 0 ? (
        <Empty
          icon={Columns3}
          title="No fund columns"
          description="There are no active departments to show on the Cash Statement."
        />
      ) : (
        <>
          {trust.length === 0 && (
            <Alert className="border-warning/40 bg-warning/10 text-warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No trust fund columns</AlertTitle>
              <AlertDescription>
                No department is marked as a trust fund, so the statement will show only local funds.
                Turn on &quot;Trust fund&quot; for departments remitted to the conference.
              </AlertDescription>
            </Alert>
          )}
          <ColumnGroup title="Trust funds" columns={trust} startIndex={0} tone="trust" />
          <ColumnGroup title="Local funds" columns={local} startIndex={trust.length} tone="local" />
        </>
      )}
    </div>
  );
}

export interface StatementColumnsPreviewDialogProps extends StatementColumnsPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Dialog wrapper; only queries while open. */
export function StatementColumnsPreviewDialog({
  open,
  onOpenChange,
  dateFrom,
  dateTo,
}: StatementColumnsPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cash Statement columns</DialogTitle>
          <DialogDescription>
            Fund columns come from departments: trust funds first, then local funds, each sorted by
            statement order. Purposes with their own column appear as DEPARTMENT – PURPOSE.
          </DialogDescription>
        </DialogHeader>
        {open && <StatementColumnsPreview dateFrom={dateFrom} dateTo={dateTo} />}
      </DialogContent>
    </Dialog>
  );
}
