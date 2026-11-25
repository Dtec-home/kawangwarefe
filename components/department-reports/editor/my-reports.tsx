/**
 * "My reports" (DEPARTMENT_REPORTS US-2, DR-7): one card per department the
 * signed-in leader leads, for the open reporting period, with the status,
 * a due-date countdown, progress and "Start report" / "Continue".
 *
 * Staff also get links to the tracker and (admins) the periods screen, both
 * built in DR-8.
 */

"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client/react";
import { CalendarClock, CalendarX2, ClipboardList, ListChecks, Settings2, Users } from "lucide-react";
import { toast } from "sonner";

import { ProgressRing } from "@/components/department-reports/progress-ring";
import { ReportStatusBadge } from "@/components/department-reports/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_SECTION_SPECS, requiredSectionCount } from "@/lib/department-reports/sections";
import type { ReportingPeriod, TrackerRow } from "@/lib/department-reports/types";
import {
  GET_MY_DEPARTMENT_REPORTS,
  GET_REPORTING_PERIODS,
  START_DEPARTMENT_REPORT,
  unwrapReportResult,
} from "@/lib/graphql/department-reports";
import { useUserRole } from "@/lib/hooks/use-user-role";
import { cn } from "@/lib/utils";

import { dueCountdown, formatDueDate, reportErrorMessage, type DueTone } from "./helpers";

export const reportHref = (id: string) => `/admin/department-reports/${encodeURIComponent(id)}`;
export const trackerHref = (periodId: string) => `/admin/department-reports/period/${encodeURIComponent(periodId)}`;
export const PERIODS_HREF = "/admin/department-reports/periods";

/** Progress counts required sections only (matches the backend). */
const TOTAL_SECTIONS = requiredSectionCount(DEFAULT_SECTION_SPECS);

const DUE_TONE_CLASS: Record<DueTone, string> = {
  ok: "text-muted-foreground",
  soon: "text-warning",
  overdue: "text-destructive font-medium",
};

interface ReportCardProps {
  row: TrackerRow;
  period: ReportingPeriod;
  starting: boolean;
  onStart: (row: TrackerRow) => void;
  onOpen: (reportId: string) => void;
}

export function ReportCard({ row, period, starting, onStart, onOpen }: ReportCardProps) {
  const report = row.report;
  const handedIn = row.status === "submitted" || row.status === "approved";
  const due = dueCountdown(period.dueDate);
  const headingId = `dept-card-${row.department.id}`;

  return (
    <Card data-testid="dept-report-card" aria-labelledby={headingId} className="gap-4 py-5">
      <CardContent className="space-y-4 px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h2 id={headingId} className="text-lg font-semibold leading-tight break-words">
              {row.department.name}
            </h2>
            <p className="text-sm text-muted-foreground">Period {period.label}</p>
          </div>
          <ProgressRing done={row.progress} total={TOTAL_SECTIONS} />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <ReportStatusBadge status={row.status} overdue={row.overdue} />
          <span className="inline-flex items-center gap-1 text-sm">
            <CalendarClock aria-hidden="true" className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">Due {formatDueDate(period.dueDate)}</span>
            {!handedIn ? <span className={cn("ml-1", DUE_TONE_CLASS[due.tone])}>· {due.label}</span> : null}
          </span>
        </div>

        <p className="text-sm text-muted-foreground">
          {row.progress} of {TOTAL_SECTIONS} required sections done
          {row.leaderNames.length > 0 ? ` · Leaders: ${row.leaderNames.join(", ")}` : ""}
        </p>

        <div className="flex justify-end">
          {report ? (
            <Button size="mobile" onClick={() => onOpen(report.id)} variant={report.canEdit ? "default" : "outline"}>
              {report.canEdit ? "Continue" : "View report"}
            </Button>
          ) : (
            <Button size="mobile" onClick={() => onStart(row)} disabled={starting}>
              {starting ? "Starting…" : "Start report"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StaffLinks({ openPeriod, isAdmin }: { openPeriod: ReportingPeriod | null; isAdmin: boolean }) {
  if (!openPeriod && !isAdmin) return null;
  return (
    <nav aria-label="Staff tools" className="flex flex-wrap gap-2">
      {openPeriod ? (
        <Button asChild variant="outline" size="mobile-sm">
          <Link href={trackerHref(openPeriod.id)}>
            <ListChecks aria-hidden="true" className="size-4" />
            Open the tracker
          </Link>
        </Button>
      ) : null}
      {isAdmin ? (
        <Button asChild variant="outline" size="mobile-sm">
          <Link href={PERIODS_HREF}>
            <Settings2 aria-hidden="true" className="size-4" />
            Reporting periods
          </Link>
        </Button>
      ) : null}
    </nav>
  );
}

export function MyReports() {
  const router = useRouter();
  const { isStaff, isAdmin, isClerk } = useUserRole();
  const periodsQuery = useQuery(GET_REPORTING_PERIODS, { fetchPolicy: "cache-and-network" });
  const reportsQuery = useQuery(GET_MY_DEPARTMENT_REPORTS, {
    variables: { periodId: null },
    fetchPolicy: "cache-and-network",
  });
  const [startReport] = useMutation(START_DEPARTMENT_REPORT);
  const [starting, setStarting] = useState<string | null>(null);

  const periods = periodsQuery.data?.reportingPeriods ?? [];
  const openPeriod = periods.find((p) => p.status === "open") ?? null;
  const rows = reportsQuery.data?.myDepartmentReports ?? [];
  const loading = (periodsQuery.loading && !periodsQuery.data) || (reportsQuery.loading && !reportsQuery.data);
  const failed = (periodsQuery.error && !periodsQuery.data) || (reportsQuery.error && !reportsQuery.data);

  const open = (id: string) => router.push(reportHref(id));

  const start = async (row: TrackerRow) => {
    if (!openPeriod) return;
    setStarting(row.department.id);
    try {
      const { data } = await startReport({
        variables: { periodId: openPeriod.id, departmentId: row.department.id },
      });
      const { report, error } = unwrapReportResult(data?.startDepartmentReport);
      if (report) {
        open(report.id);
        return;
      }
      toast.error(error ? reportErrorMessage(error) : "Couldn't start the report. Please try again.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start the report. Please try again.");
    } finally {
      setStarting(null);
    }
  };

  let body: ReactNode;
  if (loading) {
    body = (
      <div className="grid gap-4 md:grid-cols-2" data-testid="dept-reports-loading">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  } else if (failed) {
    body = (
      <Card>
        <CardContent>
          <Empty
            icon={ClipboardList}
            title="Couldn't load your reports"
            description={(reportsQuery.error ?? periodsQuery.error)?.message}
            action={
              <Button
                variant="outline"
                onClick={() => {
                  void periodsQuery.refetch();
                  void reportsQuery.refetch();
                }}
              >
                Try again
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  } else if (!openPeriod) {
    body = (
      <Card>
        <CardContent>
          <Empty
            icon={CalendarX2}
            title="No reporting period is open"
            description="When the church opens the next reporting year, your department's report will appear here."
          />
        </CardContent>
      </Card>
    );
  } else if (rows.length === 0) {
    body = (
      <Card>
        <CardContent>
          <Empty
            icon={Users}
            title="You don't lead a department"
            description={
              isStaff
                ? "Reports are written by department leaders. Use the tracker to follow every department."
                : isClerk
                  ? "Reports are written by department leaders. Use the tracker to read every department's report."
                  : "Only department leaders write reports. Ask the church office if you should be listed as a leader."
            }
          />
        </CardContent>
      </Card>
    );
  } else {
    body = (
      <section aria-label={`Reports for ${openPeriod.label}`} className="grid gap-4 md:grid-cols-2">
        {rows.map((row) => (
          <ReportCard
            key={row.department.id}
            row={row}
            period={openPeriod}
            starting={starting === row.department.id}
            onStart={start}
            onOpen={open}
          />
        ))}
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {/* Staff and the clerk (R4, read-only) follow every department in the tracker. */}
      {isStaff || isClerk ? <StaffLinks openPeriod={openPeriod} isAdmin={isAdmin} /> : null}
      {body}
    </div>
  );
}
