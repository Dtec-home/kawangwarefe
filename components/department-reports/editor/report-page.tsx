/**
 * /admin/department-reports/[id] body (DR-7): loads the report, shows its
 * header (department, period, status, autosave, progress, and the staff
 * `ReportActions` from DR-8), then either the leader's editor (`canEdit`) or
 * the read-only preview.
 */

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { skipToken, useMutation, useQuery } from "@apollo/client/react";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { toast } from "sonner";

import { AutosaveIndicator } from "@/components/department-reports/autosave-indicator";
import { ProgressRing } from "@/components/department-reports/progress-ring";
import { ReportPreview } from "@/components/department-reports/report-preview";
import { ReportActions } from "@/components/department-reports/staff/report-actions";
import { ReviewHistory } from "@/components/department-reports/editor/review-comments";
import { ReportStatusBadge } from "@/components/department-reports/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_SECTION_SPECS } from "@/lib/department-reports/sections";
import type { ReportError, ReportSectionSpec } from "@/lib/department-reports/types";
import { requiredSectionCount } from "@/lib/department-reports/sections";
import { useReportDraft } from "@/lib/department-reports/use-report-draft";
import { useUserRole } from "@/lib/hooks/use-user-role";
import {
  CARRY_FORWARD_OBJECTIVES,
  GET_DEPARTMENT_REPORT,
  GET_REPORTING_PERIODS,
  GET_REPORT_SECTION_SPECS,
  SUBMIT_DEPARTMENT_REPORT,
  unwrapReportResult,
} from "@/lib/graphql/department-reports";

import { dueCountdown, formatDueDate, previousPeriod, reportErrorMessage } from "./helpers";
import { ReportEditorView } from "./report-editor";

export const MY_REPORTS_HREF = "/admin/department-reports";

/** The server's section registry, or the contract defaults until it loads. */
export function useSectionSpecs(): readonly ReportSectionSpec[] {
  const { data } = useQuery(GET_REPORT_SECTION_SPECS, { fetchPolicy: "cache-first" });
  const specs = data?.reportSectionSpecs;
  return specs && specs.length > 0 ? specs : DEFAULT_SECTION_SPECS;
}

const asError = (err: unknown): ReportError => ({
  __typename: "ReportError",
  code: "network",
  message: err instanceof Error ? err.message : "Something went wrong. Please try again.",
  missing: [],
});

/**
 * Leaders go back to their reports; staff reviewing — or the clerk reading
 * (R4) — another department go back to the tracker.
 */
function BackLink({ report }: { report?: { department: { id: string }; period: { id: string } } | null }) {
  const { isStaff, isClerk, ledDepartmentIds } = useUserRole();
  const toTracker = !!report && (isStaff || !!isClerk) && !(ledDepartmentIds ?? []).includes(report.department.id);
  const href = toTracker ? `/admin/department-reports/period/${report!.period.id}` : MY_REPORTS_HREF;
  return (
    <Button asChild variant="ghost" size="mobile-sm" className="-ml-2">
      <Link href={href}>
        <ArrowLeft aria-hidden="true" />
        {toTracker ? "Tracker" : "My reports"}
      </Link>
    </Button>
  );
}

export function ReportPage({ reportId }: { reportId: string }) {
  const draft = useReportDraft(reportId);
  // Same query as the hook (served from the cache); gives the page a refetch and the error.
  const reportQuery = useQuery(GET_DEPARTMENT_REPORT, { variables: { id: reportId }, fetchPolicy: "cache-first" });
  const specs = useSectionSpecs();
  const report = draft.report;
  const wantsPeriods = (report?.carryForwardCandidates.length ?? 0) > 0;
  const periodsQuery = useQuery(GET_REPORTING_PERIODS, wantsPeriods ? { fetchPolicy: "cache-first" } : skipToken);
  const [carryForward] = useMutation(CARRY_FORWARD_OBJECTIVES);
  const [submitReport] = useMutation(SUBMIT_DEPARTMENT_REPORT);

  // A save the server refused (locked, too long, ...) is worth a toast once.
  useEffect(() => {
    if (draft.errorCode) toast.error(reportErrorMessage({ code: draft.errorCode, message: draft.error }));
  }, [draft.errorCode, draft.error]);

  const refetch = () => {
    void reportQuery.refetch();
  };

  if (!report) {
    if (draft.loading || reportQuery.loading) {
      return (
        <div className="space-y-4" data-testid="dept-report-loading" aria-busy="true">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-40" />
          <div className="grid gap-4 sm:grid-cols-[13rem_1fr]">
            <Skeleton className="h-72 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <BackLink />
        <Card>
          <CardContent>
            <Empty
              icon={FileQuestion}
              title="This report isn't available"
              description={
                reportQuery.error
                  ? "You may not have access to it. Department reports are open to the department's leaders and church staff."
                  : "It may have been removed, or the link is wrong."
              }
              action={
                <Button asChild variant="outline">
                  <Link href={MY_REPORTS_HREF}>Back to my reports</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const previous = periodsQuery.data ? previousPeriod(periodsQuery.data.reportingPeriods, report.period) : null;
  const handedIn = report.status === "submitted" || report.status === "approved";
  const due = dueCountdown(report.period.dueDate);

  const onCarryForward = async (itemIds: string[]) => {
    try {
      const { data } = await carryForward({ variables: { id: report.id, itemIds } });
      return unwrapReportResult(data?.carryForwardObjectives).error;
    } catch (err) {
      return asError(err);
    }
  };

  const onSubmit = async () => {
    try {
      const { data } = await submitReport({ variables: { id: report.id } });
      const { report: submitted, error } = unwrapReportResult(data?.submitDepartmentReport);
      if (error) return error;
      return submitted ? null : asError(null);
    } catch (err) {
      return asError(err);
    }
  };

  return (
    <div className="space-y-4">
      <BackLink report={report} />
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight break-words">{report.department.name} report</h1>
          <p className="text-sm text-muted-foreground">
            Period {report.period.label} · Due {formatDueDate(report.period.dueDate)}
            {handedIn ? "" : ` · ${due.label}`}
          </p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1">
            <ReportStatusBadge status={report.status} overdue={report.overdue} />
            {report.canEdit ? (
              <AutosaveIndicator
                status={draft.status}
                retrying={draft.retrying}
                error={draft.error}
                lastSavedAt={draft.lastSavedAt}
              />
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ProgressRing done={report.progress} total={requiredSectionCount(specs)} size={52} />
          <span className="text-sm text-muted-foreground">
            {report.progress} of {requiredSectionCount(specs)} required sections done
          </span>
        </div>
      </header>

      <ReportActions report={report} onChanged={refetch} />

      {report.canEdit ? (
        <ReportEditorView
          // A fresh editor when the report changes version (e.g. reopened).
          key={`${report.id}:${report.version}`}
          report={report}
          specs={specs}
          draft={draft}
          previousPeriodLabel={previous?.label ?? null}
          onCarryForward={onCarryForward}
          onSubmit={onSubmit}
          onNotify={(kind, message) => (kind === "success" ? toast.success(message) : toast.error(message))}
        />
      ) : (
        <>
          <ReviewHistory comments={report.comments} specs={specs} expanded={report.status === "returned"} />
          <ReportPreview report={report} specs={specs} />
        </>
      )}
    </div>
  );
}
