/**
 * The single status mapping for department reports (DR-6), used by the status
 * badge, the tracker and the "My reports" cards.
 *
 * Overdue is never a label: it is a separate flag shown as its own chip. It
 * only escalates the tone of a report that is still with the leader.
 */

import type { StatusVariant } from "@/components/ui/status-badge";
import type { TrackerStatus } from "@/lib/department-reports/types";

const LABELS: Record<TrackerStatus, string> = {
  not_started: "Not started",
  draft: "Draft",
  submitted: "Submitted",
  returned: "Returned",
  approved: "Approved",
};

const TONES: Record<TrackerStatus, StatusVariant> = {
  not_started: "neutral",
  draft: "info",
  submitted: "warning",
  returned: "destructive",
  approved: "success",
};

/** Statuses in which the report is still the leader's to finish. */
const WITH_LEADER: ReadonlySet<string> = new Set(["not_started", "draft", "returned"]);

function isKnown(status: string): status is TrackerStatus {
  return status in LABELS;
}

export function statusLabel(status: TrackerStatus | (string & {})): string {
  if (isKnown(status)) return LABELS[status];
  const words = status.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function statusTone(status: TrackerStatus | (string & {}), overdue = false): StatusVariant {
  if (showOverdue(status, overdue)) return "destructive";
  return isKnown(status) ? TONES[status] : "neutral";
}

/** Show the "Overdue" chip? Only while the report is still with the leader. */
export function showOverdue(status: TrackerStatus | (string & {}), overdue: boolean): boolean {
  return overdue && WITH_LEADER.has(status);
}
