"use client";

/**
 * Actions on one department report, shown in the report page header (DR-8 owns this file).
 *
 * Contract between DR-7 (the report page renders this) and DR-8 (implements it):
 *  - Downloads ("Download PDF", "Download Word") for anyone who can see the report.
 *  - "Send back" / "Approve" when `report.canReview`; "Reopen" when `report.canReopen`.
 *  - The treasurer's live-vs-frozen money panel when `report.liveFinancial` is present.
 *  - Calls `onChanged()` after a successful mutation so the page refetches.
 *
 * Permissions come from the server's `can*` flags only (useReportPermissions).
 */

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { CheckCircle2, FileDown, FileText, Loader2, RotateCcw, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  APPROVE_DEPARTMENT_REPORT,
  REOPEN_DEPARTMENT_REPORT,
  RETURN_DEPARTMENT_REPORT,
  unwrapReportResult,
} from "@/lib/graphql/department-reports";
import { useReportPermissions } from "@/lib/department-reports/use-report-permissions";
import type { DepartmentReport, DepartmentReportResult, ReportCommentInput } from "@/lib/department-reports/types";
import { FinancialComparePanel } from "@/components/department-reports/staff/financial-compare-panel";
import { reportErrorMessage, thrownMessage } from "@/components/department-reports/staff/report-errors";
import { ApproveDialog, ReopenDialog } from "@/components/department-reports/staff/review-dialogs";
import { SendBackDialog } from "@/components/department-reports/staff/send-back-dialog";
import { useReportDownload } from "@/components/department-reports/staff/use-report-download";

export interface ReportActionsProps {
  report: DepartmentReport;
  onChanged?: () => void;
}

type OpenDialog = "send-back" | "approve" | "reopen" | null;

export function ReportActions({ report, onChanged }: ReportActionsProps) {
  const { canReview, canReopen } = useReportPermissions(report);
  const { busy, downloadReport } = useReportDownload();
  const [dialog, setDialog] = useState<OpenDialog>(null);

  const [returnReport, { loading: returning }] = useMutation(RETURN_DEPARTMENT_REPORT);
  const [approveReport, { loading: approving }] = useMutation(APPROVE_DEPARTMENT_REPORT);
  const [reopenReport, { loading: reopening }] = useMutation(REOPEN_DEPARTMENT_REPORT);

  const departmentName = report.department?.name ?? "department";

  /** Shared result handling: toast, close, tell the page. True on success. */
  async function perform(
    run: () => Promise<DepartmentReportResult | null | undefined>,
    success: string,
    failure: string,
  ): Promise<boolean> {
    try {
      const { report: updated, error } = unwrapReportResult(await run());
      if (error || !updated) {
        toast.error(reportErrorMessage(error, failure));
        return false;
      }
      toast.success(success);
      setDialog(null);
      onChanged?.();
      return true;
    } catch (err) {
      toast.error(thrownMessage(err, failure));
      return false;
    }
  }

  const sendBack = (comments: ReportCommentInput[]) =>
    perform(
      async () => (await returnReport({ variables: { id: report.id, comments } })).data?.returnDepartmentReport,
      `Sent back to the ${departmentName} leaders`,
      "The report could not be sent back.",
    );

  const approve = () =>
    perform(
      async () => (await approveReport({ variables: { id: report.id } })).data?.approveDepartmentReport,
      `${departmentName} report approved`,
      "The report could not be approved.",
    );

  const reopen = (reason: string) =>
    perform(
      async () => (await reopenReport({ variables: { id: report.id, reason } })).data?.reopenDepartmentReport,
      `${departmentName} report reopened`,
      "The report could not be reopened.",
    );

  return (
    <div className="flex w-full flex-col gap-3" data-testid="dept-report-actions">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => downloadReport(report.id, "pdf")}
          disabled={busy !== null}
        >
          {busy === "pdf" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <FileDown className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          Download PDF
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => downloadReport(report.id, "docx")}
          disabled={busy !== null}
        >
          {busy === "docx" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          Download Word
        </Button>

        {canReview ? (
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setDialog("send-back")}>
              <Undo2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Send back
            </Button>
            <Button type="button" size="sm" onClick={() => setDialog("approve")}>
              <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Approve
            </Button>
          </>
        ) : null}

        {canReopen ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setDialog("reopen")}>
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            Reopen
          </Button>
        ) : null}
      </div>

      {report.liveFinancial ? (
        <FinancialComparePanel submitted={report.financial} today={report.liveFinancial} />
      ) : null}

      {canReview ? (
        <>
          <SendBackDialog
            open={dialog === "send-back"}
            onOpenChange={(open) => setDialog(open ? "send-back" : null)}
            onSubmit={sendBack}
            submitting={returning}
          />
          <ApproveDialog
            open={dialog === "approve"}
            onOpenChange={(open) => setDialog(open ? "approve" : null)}
            onConfirm={() => void approve()}
            submitting={approving}
            departmentName={departmentName}
          />
        </>
      ) : null}

      {canReopen ? (
        <ReopenDialog
          open={dialog === "reopen"}
          onOpenChange={(open) => setDialog(open ? "reopen" : null)}
          onConfirm={reopen}
          submitting={reopening}
          departmentName={departmentName}
        />
      ) : null}
    </div>
  );
}
