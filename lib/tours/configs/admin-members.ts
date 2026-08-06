/**
 * Tour config for /admin/members (Admin Member Management).
 *
 * See lib/tours/tour-configs.ts's createTourConfig() and the directory-level
 * convention comment in lib/help-content/index.ts for naming rules.
 */

import { createTourConfig } from "../tour-configs";

export const ADMIN_MEMBERS_TOUR_CONFIG = createTourConfig([
  {
    element: '[data-tour="members-header"]',
    title: "Member Management",
    description:
      "Search, edit, and manage every church member from this page — roles, groups, and department numbers included.",
    side: "bottom",
  },
  {
    element: '[data-tour="members-filters"]',
    title: "Search & Filter",
    description:
      "Search by name, phone number, or member number, and filter down to active or inactive members only.",
    side: "bottom",
  },
  {
    element: '[data-tour="members-actions"]',
    title: "Add or Import Members",
    description:
      "Add a single member here, or use Import to bulk-upload members from a CSV or Excel file.",
    side: "bottom",
  },
  {
    element: '[data-tour="members-table"]',
    title: "Member List & Actions",
    description:
      "Each row lets you edit details, manage roles and groups, set department numbers (e.g. Welfare), activate/deactivate, or delete a member.",
    side: "top",
  },
]);
