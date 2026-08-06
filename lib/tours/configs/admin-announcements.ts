/**
 * Tour config for /admin/announcements (announcements management).
 *
 * See lib/tours/tour-configs.ts's createTourConfig() and the directory-level
 * convention comment in lib/help-content/index.ts for naming rules.
 */

import { createTourConfig } from "../tour-configs";

export const ADMIN_ANNOUNCEMENTS_TOUR_CONFIG = createTourConfig([
  {
    element: '[data-tour="announcements-header"]',
    title: "Announcements",
    description:
      "Create a single announcement, or use Bulk Add to create several at once from a list.",
    side: "bottom",
  },
  {
    element: '[data-tour="announcements-stats"]',
    title: "Total, Active, Scheduled & Expired",
    description:
      "An announcement only shows to members while it's Active, its publish date has passed, and (if set) its expiry date hasn't — these counts track each state at a glance.",
    side: "bottom",
  },
  {
    element: '[data-tour="announcements-filters"]',
    title: "Search & Bulk Actions",
    description:
      "Search by text or filter by status. Select multiple announcements with the checkboxes to toggle them active/inactive or delete them together.",
    side: "bottom",
  },
  {
    element: '[data-tour="announcements-list"]',
    title: "Reorder, Schedule & Prioritize",
    description:
      "Drag the handle to reorder, set a publish/expiry date to schedule an announcement automatically, and raise Priority to push it higher in the public list. The menu on each card has Edit, Activate/Deactivate, and Delete.",
    side: "top",
  },
]);
