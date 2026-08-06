/**
 * Tour config for /admin/devotionals (Devotionals Management).
 *
 * See lib/tours/tour-configs.ts's createTourConfig() and the directory-level
 * convention comment in lib/help-content/index.ts for naming rules.
 */

import { createTourConfig } from "../tour-configs";

export const ADMIN_DEVOTIONALS_TOUR_CONFIG = createTourConfig([
  {
    element: '[data-tour="devotionals-header"]',
    title: "Devotionals",
    description:
      "Publish daily devotionals for members here. Use \"New Devotional\" to write one, with a title, author, scripture reference, and content.",
    side: "bottom",
  },
  {
    element: '[data-tour="devotionals-stats"]',
    title: "Total, Published, Featured & Drafts",
    description:
      "See at a glance how many devotionals you have in total, how many are published vs. still drafts, and how many are marked as featured.",
    side: "bottom",
  },
  {
    element: '[data-tour="devotionals-filters"]',
    title: "Search & Filter",
    description:
      "Search by title, author, content, or scripture reference, then narrow the list by publish status or featured flag.",
    side: "bottom",
  },
  {
    element: '[data-tour="devotionals-list"]',
    title: "Manage Each Devotional",
    description:
      "Each devotional shows its status badges. Use the menu to preview, edit, feature/unfeature, or publish/unpublish it — or delete it. Select several with the checkboxes to bulk-update or bulk-delete.",
    side: "top",
  },
]);
