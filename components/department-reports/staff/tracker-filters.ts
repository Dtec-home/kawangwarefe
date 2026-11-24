/**
 * Tracker filter chips (DR-8, US-8). "Overdue" is not a status: a row counts
 * as overdue only while the report is still with the leader (`showOverdue`,
 * the same rule the badge uses).
 */

import { showOverdue } from "@/lib/department-reports/status";
import type { TrackerRow } from "@/lib/department-reports/types";

export type TrackerFilter = "all" | "overdue" | "not_started" | "draft" | "submitted" | "returned" | "approved";

export const TRACKER_FILTERS: ReadonlyArray<{ key: TrackerFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "overdue", label: "Overdue" },
  { key: "not_started", label: "Not started" },
  { key: "draft", label: "Draft" },
  { key: "submitted", label: "Submitted" },
  { key: "returned", label: "Returned" },
  { key: "approved", label: "Approved" },
];

type RowStatus = Pick<TrackerRow, "status" | "overdue">;

export function isRowOverdue(row: RowStatus): boolean {
  return showOverdue(row.status, row.overdue);
}

export function matchesTrackerFilter(row: RowStatus, filter: TrackerFilter): boolean {
  if (filter === "all") return true;
  if (filter === "overdue") return isRowOverdue(row);
  return row.status === filter;
}

export function filterTrackerRows<R extends RowStatus>(rows: readonly R[], filter: TrackerFilter): R[] {
  return rows.filter((row) => matchesTrackerFilter(row, filter));
}

export function countTrackerRows(rows: readonly RowStatus[]): Record<TrackerFilter, number> {
  const counts = Object.fromEntries(TRACKER_FILTERS.map(({ key }) => [key, 0])) as Record<TrackerFilter, number>;
  for (const row of rows) {
    for (const { key } of TRACKER_FILTERS) {
      if (matchesTrackerFilter(row, key)) counts[key] += 1;
    }
  }
  return counts;
}

/** The AGM book holds approved reports only, so it needs at least one. */
export function canDownloadBook(rows: readonly RowStatus[]): boolean {
  return rows.some((row) => row.status === "approved");
}


/**
 * Departments that report (a leader is assigned, or a report already exists)
 * versus giving funds nobody leads, such as Tithe: the tracker lists the
 * second group apart, collapsed, so it does not crowd the real departments.
 */
export function splitByLeader<R extends Pick<TrackerRow, "leaderNames" | "report">>(
  rows: readonly R[],
): { reporting: R[]; unassigned: R[] } {
  const reporting: R[] = [];
  const unassigned: R[] = [];
  for (const row of rows) (row.leaderNames.length > 0 || row.report ? reporting : unassigned).push(row);
  return { reporting, unassigned };
}
