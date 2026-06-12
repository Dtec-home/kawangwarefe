/**
 * Notification preferences schema (Wave 1 / member parity).
 *
 * Mirrors the mobile app's per-channel notification toggles. There is no
 * member-preferences mutation in lib/graphql/ (verified), so these prefs are
 * persisted to localStorage; this schema is the single source of truth for
 * their shape and is reused by the hook and the page form.
 */

import { z } from "zod";

/**
 * Each channel defaults to `true` so a first-time member is opted in to every
 * notification until they explicitly opt out — matching the mobile default.
 */
export const notificationPreferencesSchema = z.object({
  announcements: z.boolean().default(true),
  events: z.boolean().default(true),
  devotionals: z.boolean().default(true),
  contributionReminders: z.boolean().default(true),
});

export type NotificationPreferences = z.infer<
  typeof notificationPreferencesSchema
>;

/** Canonical defaults (all channels on). */
export const defaultNotificationPreferences: NotificationPreferences =
  notificationPreferencesSchema.parse({});

/** localStorage key — namespaced like the other `cfms_*` flags. */
export const NOTIFICATION_PREFERENCES_STORAGE_KEY =
  "cfms_notification_preferences";

/** UI metadata for rendering the toggle list (data-driven, DRY). */
export const NOTIFICATION_CHANNELS: ReadonlyArray<{
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}> = [
  {
    key: "announcements",
    label: "Announcements",
    description: "Church-wide news and important notices.",
  },
  {
    key: "events",
    label: "Events",
    description: "Upcoming services, meetings, and gatherings.",
  },
  {
    key: "devotionals",
    label: "Devotionals",
    description: "Daily devotionals and scripture readings.",
  },
  {
    key: "contributionReminders",
    label: "Contribution reminders",
    description: "Gentle reminders about your giving.",
  },
];
