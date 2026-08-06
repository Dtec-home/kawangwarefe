/**
 * Admin Contributions Tour
 * Route: /admin/contributions
 *
 * Walks a staff/admin user through the contributions list: stats, filters,
 * and the table (including split-contribution grouping and the book
 * receipt number column).
 */

import { createTourConfig } from "../tour-configs";

export const ADMIN_CONTRIBUTIONS_TOUR_CONFIG = createTourConfig([
  {
    element: '[data-tour="contributions-header"]',
    title: "Contributions",
    description:
      "Every recorded contribution lands here — M-Pesa till payments, manual entries, and resolved Pay Bill (C2B) transactions. Use Manual Entry to record a cash, envelope, or other manual contribution.",
    side: "bottom",
  },
  {
    element: '[data-tour="contributions-stats"]',
    title: "At a Glance",
    description:
      "Total, Completed, Pending, and Failed amounts and counts for the contributions currently in view.",
    side: "bottom",
  },
  {
    element: '[data-tour="contributions-filters"]',
    title: "Search & Filter",
    description:
      "Search by phone number, name, or receipt number, and narrow the list by status, department, purpose, or date range. Adjust the page size or use Clear Filters to reset everything.",
    side: "bottom",
  },
  {
    element: '[data-tour="contributions-table"]',
    title: "Contribution List",
    description:
      "A contribution paid across multiple departments in one M-Pesa prompt collapses into a single row — click it to expand the split. The Book Receipt # column lets you attach the church's physical receipt book number for reconciliation; use the pencil icon to add or edit it.",
    side: "top",
  },
]);
