/**
 * Admin C2B Transactions Tour
 * Route: /admin/c2b-transactions
 *
 * Walks a staff/admin user through the Pay Bill (C2B) transactions list:
 * stats, filters, and resolving an unmatched transaction. Deliberately
 * limited to observable UI mechanics — not the underlying matching
 * or split-resolution logic.
 */

import { createTourConfig } from "../tour-configs";

export const ADMIN_C2B_TRANSACTIONS_TOUR_CONFIG = createTourConfig([
  {
    element: '[data-tour="c2b-header"]',
    title: "C2B Transactions",
    description:
      "M-Pesa Pay Bill payments — where someone paid using the paybill/till reference directly, rather than through the app's contribution flow — appear here.",
    side: "bottom",
  },
  {
    element: '[data-tour="c2b-stats"]',
    title: "Totals",
    description:
      "Total received, Processed (auto-matched to a department), Unmatched (needs your attention), and Failed transaction counts and amounts.",
    side: "bottom",
  },
  {
    element: '[data-tour="c2b-filters"]',
    title: "Filter by Status",
    description:
      "Narrow the list to Received, Processed, Unmatched, or Failed. Refresh re-pulls the latest transactions and totals.",
    side: "bottom",
  },
  {
    element: '[data-tour="c2b-table"]',
    title: "Resolving Unmatched Transactions",
    description:
      "A row with an Unmatched status shows a Resolve button — it opens a form where you assign the payment's amount to one or more departments (and a purpose, where required) before it's recorded as a contribution.",
    side: "top",
  },
]);
