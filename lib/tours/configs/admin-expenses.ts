/**
 * Admin Expenses Tour
 * Route: /admin/expenses
 *
 * Walks a staff/admin (or department admin) user through the expenses
 * list: the summary card, filters, and how status badges / row actions
 * work. Deliberately limited to observable UI mechanics — not the
 * underlying approval or KCB disbursement architecture.
 */

import { createTourConfig } from "../tour-configs";

export const ADMIN_EXPENSES_TOUR_CONFIG = createTourConfig([
  {
    element: '[data-tour="expenses-header"]',
    title: "Expenses",
    description:
      "Track money requested, approved, and paid out of church funds. Staff and department admins can raise a new Request Expense from here.",
    side: "bottom",
  },
  {
    element: '[data-tour="expenses-summary"]',
    title: "Total Approved + Paid",
    description:
      "The KES amount and count of expenses matching your current filters that are Approved or Paid — money already committed out of the fund.",
    side: "bottom",
  },
  {
    element: '[data-tour="expenses-filters"]',
    title: "Filter Expenses",
    description:
      "Narrow the list by fund, status (Requested, Approved, Paid, or Voided), or date range.",
    side: "bottom",
  },
  {
    element: '[data-tour="expenses-table"]',
    title: "Status & Actions",
    description:
      "Each row shows a status badge and an accountability trail (who requested, approved, or paid it). The buttons available — Approve, Mark Paid, Disburse via KCB, Edit, Cancel, or Void — change per row depending on your permissions and that request's current status.",
    side: "top",
  },
]);
