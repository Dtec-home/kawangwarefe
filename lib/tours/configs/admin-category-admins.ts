/**
 * Tour config for /admin/category-admins (Department Admins).
 */

import { createTourConfig } from "../tour-configs";

export const ADMIN_CATEGORY_ADMINS_TOUR_CONFIG = createTourConfig([
  {
    element: '[data-tour="category-admins-header"]',
    title: "Department Admins",
    description:
      "Grant a member admin privileges scoped to a single contribution department, without giving them full site-admin access.",
    side: "bottom",
  },
  {
    element: '[data-tour="category-admins-assign"]',
    title: "Assign a Department Admin",
    description: "Search for a member, pick a department, then click Assign Admin.",
    side: "bottom",
  },
  {
    element: '[data-tour="category-admins-list"]',
    title: "Current Assignments",
    description:
      "Assignments are grouped by department. Remove a member's department-admin role with the trash icon.",
    side: "top",
  },
]);
