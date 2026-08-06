/**
 * Tour config for /admin/categories/[id]/purposes (Department Purposes).
 */

import { createTourConfig } from "../tour-configs";

export const ADMIN_CATEGORY_PURPOSES_TOUR_CONFIG = createTourConfig([
  {
    element: '[data-tour="purposes-header"]',
    title: "Department Purposes",
    description:
      "Purposes let a 'Requires Purpose' department break contributions down further (e.g. Camp Meeting, Choir Uniforms) under Building Fund.",
    side: "bottom",
  },
  {
    element: '[data-tour="purposes-add"]',
    title: "Add a Purpose",
    description:
      "Give it a name; a code is auto-generated from the name unless you set one yourself.",
    side: "bottom",
  },
  {
    element: '[data-tour="purposes-list"]',
    title: "Existing Purposes",
    description: "Edit, activate/deactivate, or delete a purpose from this list.",
    side: "top",
  },
  {
    element: '[data-tour="purposes-allocations"]',
    title: "Auto-Split Allocations",
    description:
      "Once at least 2 active allocations sum to exactly 100%, every contribution to this department is automatically divided across purposes — no manual selection needed.",
    side: "top",
  },
]);
