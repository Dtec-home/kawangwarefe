/**
 * Notification preferences page tour ("/profile/notifications").
 *
 * Paired with `profile_notifications_v1` as the `useTour({ tourKey })` /
 * tutorial key on app/(dashboard)/profile/notifications/page.tsx.
 */

import { createTourConfig } from "../tour-configs";

export const PROFILE_NOTIFICATIONS_TOUR_CONFIG = createTourConfig([
  {
    element: '[data-tour="notifications-header"]',
    title: "Notification Preferences",
    description:
      "Choose which updates you want to receive. These preferences are saved on this device.",
  },
  {
    element: '[data-tour="notifications-channels"]',
    title: "Choose Your Channels",
    description:
      "Toggle each notification type on or off, then use Save preferences to apply your changes.",
  },
]);
