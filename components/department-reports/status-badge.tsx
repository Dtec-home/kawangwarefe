/**
 * A department report's status pill, plus a separate "Overdue" chip (DR-6).
 * Used by the "My reports" cards, the tracker and the report page.
 */

import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { showOverdue, statusLabel, statusTone } from "@/lib/department-reports/status";
import type { TrackerStatus } from "@/lib/department-reports/types";

interface ReportStatusBadgeProps {
  status: TrackerStatus | (string & {});
  overdue: boolean;
  className?: string;
}

export function ReportStatusBadge({ status, overdue, className }: ReportStatusBadgeProps) {
  const late = showOverdue(status, overdue);
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      <StatusBadge data-testid="dept-report-status" variant={statusTone(status)}>
        {statusLabel(status)}
      </StatusBadge>
      {late ? (
        <StatusBadge data-testid="dept-report-overdue" variant="destructive">
          Overdue
        </StatusBadge>
      ) : null}
    </span>
  );
}
