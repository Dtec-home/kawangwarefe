/**
 * Submit-a-prayer-request page tour ("/prayers/new").
 *
 * Paired with `prayers_new_v1` as the `useTour({ tourKey })` / tutorial key
 * on app/(dashboard)/prayers/new/page.tsx.
 */

import { createTourConfig } from "../tour-configs";

export const PRAYERS_NEW_TOUR_CONFIG = createTourConfig([
  {
    element: '[data-tour="prayer-header"]',
    title: "Submit a Prayer Request",
    description: "Share a request and your pastors and prayer team will lift it up.",
  },
  {
    element: '[data-tour="prayer-visibility"]',
    title: "Choose Visibility",
    description:
      "Pick who can see this request: the prayer team only, just your pastor, or the public wall.",
  },
  {
    element: '[data-tour="prayer-anonymous"]',
    title: "Submit Anonymously",
    description:
      "Hide your name from the team's view while still keeping the request linked to your account for follow-up.",
  },
  {
    element: '[data-tour="prayer-history"]',
    title: "Your Requests",
    description: "Track the status of every request you've submitted.",
  },
]);
