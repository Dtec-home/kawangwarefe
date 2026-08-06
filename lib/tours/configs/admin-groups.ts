/**
 * Tour config for /admin/groups (Group Management).
 */

import { createTourConfig } from "../tour-configs";

export const ADMIN_GROUPS_TOUR_CONFIG = createTourConfig([
  {
    element: '[data-tour="groups-header"]',
    title: "Groups",
    description:
      "Groups organize members (e.g. Youth, Complex A) and can be used to auto-route contributions for departments configured that way.",
    side: "bottom",
  },
  {
    element: '[data-tour="groups-create"]',
    title: "Create a Group",
    description: "Give the group a name and save — it's immediately available for member assignment.",
    side: "bottom",
  },
  {
    element: '[data-tour="groups-list"]',
    title: "Manage Groups",
    description:
      "Rename or delete a group, use Add Members to bulk-assign members into it, or Info to see who's currently in it.",
    side: "top",
  },
]);
