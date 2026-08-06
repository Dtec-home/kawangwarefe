/**
 * Tour config for /admin/events (Events Management).
 *
 * See lib/tours/tour-configs.ts's createTourConfig() and the directory-level
 * convention comment in lib/help-content/index.ts for naming rules.
 */

import { createTourConfig } from "../tour-configs";

export const ADMIN_EVENTS_TOUR_CONFIG = createTourConfig([
  {
    element: '[data-tour="events-header"]',
    title: "Events",
    description:
      "Manage church events and gatherings here. Use \"New Event\" to add one — you can optionally attach a department and purpose to make it payable, and turn on registration.",
    side: "bottom",
  },
  {
    element: '[data-tour="events-stats"]',
    title: "Total, Upcoming, Past & Active",
    description:
      "Quick counts of your total events, how many are still upcoming vs. already past, and how many are currently active (visible to members).",
    side: "bottom",
  },
  {
    element: '[data-tour="events-filters"]',
    title: "Search & Filter",
    description:
      "Search by title, description, or location, then narrow the list to upcoming or past events, and active or inactive ones.",
    side: "bottom",
  },
  {
    element: '[data-tour="events-list"]',
    title: "Reorder, Edit & Manage Each Event",
    description:
      "Drag the handle to reorder events (or use the up/down arrows as a keyboard-friendly alternative). Events set up with a department and purpose show a \"Giving Summary\" button with the total raised; events with registration enabled show a \"Registrations\" button to view attendees, export a CSV, or cancel a registration. The menu on each card also lets you preview, edit, activate/deactivate, or delete an event.",
    side: "top",
  },
]);
