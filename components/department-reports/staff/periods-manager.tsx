"use client";

/**
 * Reporting periods (DR-8, US-1). Admins open, edit and close periods; other
 * staff see the same list read-only. Each period links to its tracker.
 */

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client/react";
import { CalendarPlus, CalendarRange, ChevronRight, Lock, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUserRole } from "@/lib/hooks/use-user-role";
import { CLOSE_REPORTING_PERIOD, GET_REPORTING_PERIODS, isReportError } from "@/lib/graphql/department-reports";
import type { ReportingPeriod } from "@/lib/department-reports/types";
import { formatPeriodDate } from "@/components/department-reports/staff/period-form";
import { PeriodFormDialog } from "@/components/department-reports/staff/period-form-dialog";
import { reportErrorMessage, thrownMessage } from "@/components/department-reports/staff/report-errors";

export const trackerHref = (periodId: string) => `/admin/department-reports/period/${periodId}`;

/** Open first, then newest start date first. */
function sortPeriods(periods: readonly ReportingPeriod[]): ReportingPeriod[] {
  return [...periods].sort((a, b) => {
    if (a.status !== b.status) return a.status === "open" ? -1 : 1;
    return b.startDate.localeCompare(a.startDate);
  });
}

export function PeriodsManager() {
  const { isAdmin } = useUserRole();
  const { data, loading, error, refetch } = useQuery(GET_REPORTING_PERIODS, { fetchPolicy: "cache-and-network" });
  const periods = sortPeriods(data?.reportingPeriods ?? []);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ReportingPeriod | null>(null);
  const [closing, setClosing] = useState<ReportingPeriod | null>(null);
  const [closePeriod, { loading: closingBusy }] = useMutation(CLOSE_REPORTING_PERIOD);

  const startOpen = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const startEdit = (period: ReportingPeriod) => {
    setEditing(period);
    setFormOpen(true);
  };

  const confirmClose = async () => {
    if (!closing) return;
    try {
      const result = (await closePeriod({ variables: { id: closing.id } })).data?.closeReportingPeriod;
      if (!result || isReportError(result)) {
        toast.error(reportErrorMessage(isReportError(result) ? result : null, "The period could not be closed."));
        return;
      }
      toast.success(`Period ${result.label} closed`);
      setClosing(null);
      await refetch();
    } catch (err) {
      toast.error(thrownMessage(err, "The period could not be closed."));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reporting periods"
        description="The church year each department reports on, and when the reports are due."
        actions={
          isAdmin ? (
            <Button onClick={startOpen}>
              <CalendarPlus className="mr-2 h-4 w-4" aria-hidden="true" />
              Open period
            </Button>
          ) : null
        }
      />

      {!isAdmin ? (
        <p className="text-sm text-muted-foreground">Only an admin can open, edit or close reporting periods.</p>
      ) : null}

      <Card>
        <CardContent className="px-0">
          {loading && periods.length === 0 ? (
            <div className="space-y-3 p-4" aria-busy="true" aria-label="Loading periods">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : error && periods.length === 0 ? (
            <Empty
              icon={CalendarRange}
              title="Periods could not be loaded"
              description={thrownMessage(error, "Please try again.")}
              action={
                <Button variant="outline" onClick={() => void refetch()}>
                  Try again
                </Button>
              }
            />
          ) : periods.length === 0 ? (
            <Empty
              icon={CalendarRange}
              title="No reporting periods yet"
              description={
                isAdmin
                  ? "Open the first period so departments know which year to report on."
                  : "An admin opens the period departments report on."
              }
              action={
                isAdmin ? (
                  <Button onClick={startOpen}>
                    <CalendarPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                    Open the first period
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="divide-y divide-border" aria-label="Reporting periods">
              {periods.map((period) => (
                <li
                  key={period.id}
                  data-testid="dept-report-period-row"
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={trackerHref(period.id)}
                        className="text-base font-semibold hover:underline focus-visible:underline"
                      >
                        {period.label}
                      </Link>
                      <StatusBadge variant={period.status === "open" ? "success" : "neutral"}>
                        {period.status === "open" ? "Open" : "Closed"}
                      </StatusBadge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatPeriodDate(period.startDate)} – {formatPeriodDate(period.endDate)}
                      <span aria-hidden="true"> · </span>
                      <span className="whitespace-nowrap">Due {formatPeriodDate(period.dueDate)}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={trackerHref(period.id)} aria-label={`Tracker for ${period.label}`}>
                        Tracker
                        <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
                      </Link>
                    </Button>
                    {isAdmin ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(period)}
                        aria-label={`Edit ${period.label}`}
                      >
                        <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                        Edit
                      </Button>
                    ) : null}
                    {isAdmin && period.status === "open" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setClosing(period)}
                        aria-label={`Close period ${period.label}`}
                      >
                        <Lock className="mr-2 h-4 w-4" aria-hidden="true" />
                        Close period
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {isAdmin ? (
        <PeriodFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          period={editing}
          onSaved={() => void refetch()}
        />
      ) : null}

      <AlertDialog open={closing !== null} onOpenChange={(open) => !open && setClosing(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close period {closing?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              Leaders can no longer start reports for this period. Submitted and approved reports stay as they
              are, and you can still download the AGM book.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={closingBusy}
              onClick={(event) => {
                event.preventDefault();
                void confirmClose();
              }}
            >
              Close period
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
