/**
 * Tour config for /admin/youtube (YouTube Videos Management).
 *
 * See lib/tours/tour-configs.ts's createTourConfig() and the directory-level
 * convention comment in lib/help-content/index.ts for naming rules.
 */

import { createTourConfig } from "../tour-configs";

export const ADMIN_YOUTUBE_TOUR_CONFIG = createTourConfig([
  {
    element: '[data-tour="youtube-header"]',
    title: "YouTube Videos",
    description:
      "Manage the church's video library. \"Add Video\" adds a single video by its YouTube video ID; \"Sync from YouTube\" pulls in a batch of videos from your channel or a specific playlist in one go.",
    side: "bottom",
  },
  {
    element: '[data-tour="youtube-filters"]',
    title: "Search & Filter",
    description:
      "Search by title or description, then narrow the list by category (sermon, worship, testimony, teaching, event, other), by source (manually added, or synced from a channel/playlist), or by featured status.",
    side: "bottom",
  },
  {
    element: '[data-tour="youtube-list"]',
    title: "Manage Each Video",
    description:
      "Each card shows view count, likes, and duration. Preview a video in-page, or use the menu to edit its title/description/category, feature/unfeature it, open it on YouTube, or delete it. Select several with the checkboxes to bulk-feature or bulk-delete.",
    side: "top",
  },
]);
