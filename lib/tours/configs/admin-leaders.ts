/**
 * Tour config for /admin/leaders (Leaders & About management).
 *
 * See lib/tours/tour-configs.ts's createTourConfig() and the directory-level
 * convention comment in lib/help-content/index.ts for naming rules.
 */

import { createTourConfig } from "../tour-configs";

export const ADMIN_LEADERS_TOUR_CONFIG = createTourConfig([
  {
    element: '[data-tour="leaders-header"]',
    title: "Leaders & About",
    description:
      "Manage the leadership team shown on the public About page and home page. Click Add Leader to introduce a new profile.",
    side: "bottom",
  },
  {
    element: '[data-tour="leaders-stats"]',
    title: "Total, Active & Inactive",
    description:
      "Only active leaders are shown publicly — deactivate a profile instead of deleting it if someone steps away temporarily.",
    side: "bottom",
  },
  {
    element: '[data-tour="leaders-list"]',
    title: "Drag to Reorder",
    description:
      "Grab the handle on the left of a row and drag to change display order — the order here is exactly the order leaders appear on the public site. Each row also has Edit, Activate/Deactivate, and Delete actions.",
    side: "top",
  },
]);
