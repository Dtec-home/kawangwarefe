/**
 * Admin Reports Tour
 * Route: /admin/reports
 *
 * Walks a staff/admin user through the Reports page's four views (Overview,
 * Explore Data, Member Progress, and — staff only — Exports) and the
 * live department-routing analytics shown by default.
 */

import { createTourConfig } from "../tour-configs";

export const ADMIN_REPORTS_TOUR_CONFIG = createTourConfig([
  {
    element: '[data-tour="reports-header"]',
    title: "Reports",
    description:
      "Generate downloadable reports and explore live giving analytics from here.",
    side: "bottom",
  },
  {
    element: '[data-tour="reports-modes"]',
    title: "Four Views",
    description:
      "Overview shows the routing summary and top breakdowns. Explore Data adds detailed, sortable, paginated breakdown tables you can click into for more detail. Member Progress looks up one member's giving history. Exports (staff only) generates downloadable Excel/PDF reports.",
    side: "bottom",
  },
  {
    element: '[data-tour="reports-filters"]',
    title: "Filter the Analytics",
    description:
      "Filter by department, purpose, group, date range, or routing type. Active filters are listed as chips here — use Reset Filters to clear them all at once.",
    side: "bottom",
  },
  {
    element: '[data-tour="reports-results"]',
    title: "Live Totals",
    description:
      "Totals update instantly as you change the filters above: Total Completed, Guest Top-level, Member Routed to Group, and Member Top-level giving.",
    side: "top",
  },
]);
