"use client";

/**
 * The department report tracker for one period (DR-8, US-8, US-12): a row per
 * department with its status, overdue chip, progress and leaders; status
 * chips that filter the list; and the "Download AGM book" button (approved
 * reports only). One DOM per row — a grid on desktop, a card on phones — so
 * each department has exactly one `dept-report-tracker-row`.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { ArrowLeft, BookOpen, ClipboardList, Loader2, TriangleAlert, UserX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { ProgressRing } from "@/components/department-reports/progress-ring";
import { ReportStatusBadge } from "@/components/department-reports/status-badge";
import { DEFAULT_SECTION_SPECS, requiredSectionCount } from "@/lib/department-reports/sections";
import { GET_DEPARTMENT_REPORT_TRACKER, GET_REPORTING_PERIODS } from "@/lib/graphql/department-reports";
import type { TrackerRow } from "@/lib/department-reports/types";
import { formatPeriodDate } from "@/components/department-reports/staff/period-form";
import { thrownMessage } from "@/components/department-reports/staff/report-errors";
import {
  canDownloadBook,
  countTrackerRows,
  filterTrackerRows,
  splitByLeader,
  TRACKER_FILTERS,
  type TrackerFilter,
} from "@/components/department-reports/staff/tracker-filters";
import { useReportDownload } from "@/components/department-reports/staff/use-report-download";

/** Progress counts required sections only (matches the backend). */
const SECTION_COUNT = requiredSectionCount(DEFAULT_SECTION_SPECS);

export const reportHref = (reportId: string) => `/admin/department-reports/${reportId}`;

function TrackerRowItem({ row }: { row: TrackerRow }) {
  const noLeader = row.leaderNames.length === 0;
  const name = row.department.name;
  return (
    <li
      data-testid="dept-report-tracker-row"
      className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 p-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_auto_auto]"
    >
      <div className="col-span-2 min-w-0 md:col-span-1">
        <p className="font-semibold">{name}</p>
        {noLeader ? (
          <StatusBadge variant="warning" className="mt-1">
            No leader assigned
          </StatusBadge>
        ) : (
          <p className="truncate text-sm text-muted-foreground" title={row.leaderNames.join(", ")}>
            {row.leaderNames.join(", ")}
          </p>
        )}
      </div>
      <div className="min-w-0">
        <ReportStatusBadge status={row.status} overdue={row.overdue} />
      </div>
      <div className="flex items-center gap-2 justify-self-end md:justify-self-start">
        <ProgressRing done={row.progress} total={SECTION_COUNT} size={36} />
        <span className="text-xs text-muted-foreground md:sr-only">sections done</span>
      </div>
      <div className="col-span-2 md:col-span-1 md:justify-self-end">
        {row.report ? (
          <Button asChild variant="outline" size="sm" className="w-full md:w-auto">
            <Link href={reportHref(row.report.id)} aria-label={`Open ${name} report`}>
              Open
            </Link>
          </Button>
        ) : (
          <span className="text-sm text-muted-foreground">No report yet</span>
        )}
      </div>
    </li>
  );
}

export function PeriodTracker({ periodId }: { periodId: string }) {
  const [filter, setFilter] = useState<TrackerFilter>("all");
  const { data, loading, error, refetch } = useQuery(GET_DEPARTMENT_REPORT_TRACKER, {
    variables: { periodId },
    skip: !periodId,
    fetchPolicy: "cache-and-network",
  });
  const { data: periodsData } = useQuery(GET_REPORTING_PERIODS, { fetchPolicy: "cache-first" });
  const { busy, downloadBook } = useReportDownload();

  const period = periodsData?.reportingPeriods?.find((p) => p.id === periodId) ?? null;
  const rows = useMemo(
    () => [...(data?.departmentReportTracker ?? [])].sort((a, b) => a.department.name.localeCompare(b.department.name)),
    [data],
  );
  // Funds nobody leads and nobody reported on (e.g. Tithe) are listed apart, collapsed.
  const { reporting, unassigned } = useMemo(() => splitByLeader(rows), [rows]);
  const counts = useMemo(() => countTrackerRows(reporting), [reporting]);
  const visible = useMemo(() => filterTrackerRows(reporting, filter), [reporting, filter]);
  const bookReady = canDownloadBook(rows);
  const handedIn = counts.submitted + counts.approved;
  const showBookHelp = !bookReady && rows.length > 0;

  const title = period ? `Department reports ${period.label}` : "Department reports";
  const description = period
    ? `${formatPeriodDate(period.startDate)} – ${formatPeriodDate(period.endDate)} · due ${formatPeriodDate(period.dueDate)}`
    : "Every department's yearly report for this period.";

  return (
    <div className="space-y-6">
      <Link
        href="/admin/department-reports/periods"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Reporting periods
      </Link>

      <PageHeader
        title={title}
        description={description}
        className="flex-col sm:flex-row"
        actions={
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <Button
              onClick={() => void downloadBook(periodId)}
              disabled={!bookReady || busy !== null}
              aria-describedby={showBookHelp ? "agm-book-help" : undefined}
            >
              {busy === "book" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
              )}
              Download AGM book
            </Button>
            {showBookHelp ? (
              <p id="agm-book-help" className="max-w-xs text-xs text-muted-foreground sm:text-right">
                The AGM book holds approved reports only. Approve at least one report first.
              </p>
            ) : null}
          </div>
        }
      />

      {rows.length > 0 ? (
        <p className="text-sm text-muted-foreground" data-testid="dept-report-tracker-summary">
          {handedIn} of {reporting.length} departments have handed in their report · {counts.approved} approved
          {counts.overdue > 0 ? ` · ${counts.overdue} overdue` : ""}
        </p>
      ) : null}

      {rows.length > 0 ? (
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
          {TRACKER_FILTERS.map(({ key, label }) => {
            const active = filter === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(key)}
                className={cn(
                  "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:bg-accent",
                  key === "overdue" && !active && counts.overdue > 0 && "border-destructive/40 text-destructive",
                )}
              >
                {label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs tabular-nums",
                    active ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground",
                  )}
                >
                  {counts[key]}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <Card className="py-0">
        <CardContent className="px-0">
          {loading && rows.length === 0 ? (
            <div className="space-y-3 p-4" aria-busy="true" aria-label="Loading departments">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : error && rows.length === 0 ? (
            <Empty
              icon={ClipboardList}
              title="The tracker could not be loaded"
              description={thrownMessage(error, "Please try again.")}
              action={
                <Button variant="outline" onClick={() => void refetch()}>
                  Try again
                </Button>
              }
            />
          ) : reporting.length === 0 ? (
            <Empty
              icon={ClipboardList}
              title="No departments to report on"
              description="Departments appear here once a leader is assigned under Dept. Admins."
            />
          ) : visible.length === 0 ? (
            <Empty
              icon={UserX}
              title="No departments match this filter"
              action={
                <Button variant="outline" onClick={() => setFilter("all")}>
                  Show all
                </Button>
              }
            />
          ) : (
            <>
              <div
                aria-hidden="true"
                className="hidden border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_auto_auto] md:gap-x-4"
              >
                <span>Department</span>
                <span>Status</span>
                <span>Progress</span>
                <span className="w-16" />
              </div>
              <ul className="divide-y divide-border" aria-label="Departments">
                {visible.map((row) => (
                  <TrackerRowItem key={row.department.id} row={row} />
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      {unassigned.length > 0 ? (
        <details data-testid="dept-report-unassigned" className="rounded-xl border bg-card p-4 shadow-xs">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium">
            <TriangleAlert className="h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
            {unassigned.length === 1 ? "1 department has" : `${unassigned.length} departments have`} no leader
            <span className="font-normal text-muted-foreground">
              — nobody is asked for a report. Assign a leader under Dept. Admins if one is needed.
            </span>
          </summary>
          <ul className="mt-3 divide-y divide-border" aria-label="Departments without a leader">
            {unassigned.map((row) => (
              <TrackerRowItem key={row.department.id} row={row} />
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
