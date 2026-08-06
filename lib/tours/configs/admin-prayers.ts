/**
 * Tour config for /admin/prayers (prayer request moderation).
 *
 * See lib/tours/tour-configs.ts's createTourConfig() and the directory-level
 * convention comment in lib/help-content/index.ts for naming rules.
 */

import { createTourConfig } from "../tour-configs";

export const ADMIN_PRAYERS_TOUR_CONFIG = createTourConfig([
  {
    element: '[data-tour="prayers-header"]',
    title: "Prayer Requests",
    description:
      "Every prayer request submitted by members and visitors lands here for review and follow-up.",
    side: "bottom",
  },
  {
    element: '[data-tour="prayers-filter"]',
    title: "Filter by Status",
    description:
      "Narrow the list to Open, Praying, Answered, or Archived requests, or leave it on All statuses.",
    side: "bottom",
  },
  {
    element: '[data-tour="prayers-list"]',
    title: "Review & Update Status",
    description:
      "Anonymous requests hide the requester's name automatically. Use the buttons under each request to mark it Praying, Answered, or Archived as your team follows up.",
    side: "top",
  },
]);
