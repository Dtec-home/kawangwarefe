"use client";

/**
 * Load + persist a member's notification preferences (Wave 1 / member parity).
 *
 * localStorage-only: no member-preferences GraphQL mutation exists, so the
 * browser is the source of truth. The Zod schema guards against corrupt or
 * stale stored data by re-validating on read and falling back to defaults.
 */

import { useCallback, useState } from "react";

import {
  NOTIFICATION_PREFERENCES_STORAGE_KEY,
  NotificationPreferences,
  defaultNotificationPreferences,
  notificationPreferencesSchema,
} from "@/lib/notifications/notification-preferences-schema";

function readStoredPreferences(): NotificationPreferences {
  if (typeof window === "undefined") return defaultNotificationPreferences;
  try {
    const raw = window.localStorage.getItem(
      NOTIFICATION_PREFERENCES_STORAGE_KEY
    );
    if (!raw) return defaultNotificationPreferences;
    // `parse` applies per-field defaults for any missing keys.
    return notificationPreferencesSchema.parse(JSON.parse(raw));
  } catch {
    // Corrupt JSON or schema mismatch — fall back to safe defaults.
    return defaultNotificationPreferences;
  }
}

export function useNotificationPreferences() {
  // Lazy initialiser reads stored prefs once on first render (client-side).
  // On the server this returns defaults; the client reconciles on mount.
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    readStoredPreferences
  );

  const save = useCallback((next: NotificationPreferences) => {
    const validated = notificationPreferencesSchema.parse(next);
    setPreferences(validated);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        NOTIFICATION_PREFERENCES_STORAGE_KEY,
        JSON.stringify(validated)
      );
    }
  }, []);

  return { preferences, save };
}
