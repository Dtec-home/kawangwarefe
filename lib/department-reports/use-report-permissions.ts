/**
 * What the viewer may do with a report (DR-6). Reads the server's `can*`
 * fields only — the client never derives report permissions from roles
 * (02_CONTRACTS.md § Frontend; the truth table lives in ReportPermissions).
 */

"use client";

import { useMemo } from "react";

import type { DepartmentReportDraft } from "@/lib/department-reports/types";

export type ReportPermissionFlags = Pick<DepartmentReportDraft, "canEdit" | "canSubmit" | "canReview" | "canReopen">;

/** Everything false while the report is loading or missing. */
export function reportPermissions(report: ReportPermissionFlags | null | undefined): ReportPermissionFlags {
  return {
    canEdit: report?.canEdit ?? false,
    canSubmit: report?.canSubmit ?? false,
    canReview: report?.canReview ?? false,
    canReopen: report?.canReopen ?? false,
  };
}

export function useReportPermissions(report: ReportPermissionFlags | null | undefined): ReportPermissionFlags {
  const canEdit = report?.canEdit;
  const canSubmit = report?.canSubmit;
  const canReview = report?.canReview;
  const canReopen = report?.canReopen;
  return useMemo(
    () => reportPermissions({ canEdit: !!canEdit, canSubmit: !!canSubmit, canReview: !!canReview, canReopen: !!canReopen }),
    [canEdit, canSubmit, canReview, canReopen],
  );
}
