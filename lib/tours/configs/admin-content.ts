/**
 * Tour config for /admin/content (Church Content Hub).
 *
 * See lib/tours/tour-configs.ts's createTourConfig() and the directory-level
 * convention comment in lib/help-content/index.ts for naming rules.
 */

import { createTourConfig } from "../tour-configs";

export const ADMIN_CONTENT_TOUR_CONFIG = createTourConfig([
  {
    element: '[data-tour="content-hub-header"]',
    title: "Church Content",
    description:
      "This hub is just a launchpad — pick a content type below to manage announcements, devotionals, events, or YouTube videos.",
    side: "bottom",
  },
  {
    element: '[data-tour="content-hub-grid"]',
    title: "Announcements, Devotionals, Events & Videos",
    description:
      "Each card opens its own management page: Announcements for notices, Devotionals for daily readings, Events for scheduling, and YouTube Videos for sermon recordings.",
    side: "top",
  },
]);
