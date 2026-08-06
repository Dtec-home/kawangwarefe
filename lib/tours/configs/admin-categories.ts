/**
 * Tour config for /admin/categories (Contribution Department Management).
 */

import { createTourConfig } from "../tour-configs";

export const ADMIN_CATEGORIES_TOUR_CONFIG = createTourConfig([
  {
    element: '[data-tour="categories-header"]',
    title: "Contribution Departments",
    description:
      "Departments (e.g. Tithe, Offering, Building Fund) are the top-level buckets contributions are routed into. Add a new one here.",
    side: "bottom",
  },
  {
    element: '[data-tour="categories-stats"]',
    title: "Department Counts",
    description: "Track how many departments exist and how many are active vs. inactive.",
    side: "bottom",
  },
  {
    element: '[data-tour="categories-list"]',
    title: "Manage Each Department",
    description:
      "Edit routing rules, configure fund/expense tracking, set up purposes for departments that require one, and activate, deactivate, or delete a department.",
    side: "top",
  },
]);
