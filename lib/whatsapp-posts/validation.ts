/**
 * Client checks for the totals-post settings (WA-3). They mirror
 * `PostSettingsService` (church_BE/fundraising/services/post_settings.py),
 * word for word, so the screen refuses early what the server would refuse.
 * The server stays authoritative.
 */

import { SCHEDULE_KINDS, type PostSettings, type SettingField } from "./types";

export const MIN_INTERVAL_MINUTES = 30;
export const TEXT_MAX = 1000;

export type SettingsErrors = Partial<Record<SettingField, string>>;

/** "08:00" or "8:00" with a real hour and minute (`parse_hhmm`). */
export function isTime(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const match = /^(\d+):(\d{2})$/.exec(value.trim());
  if (!match) return false;
  return Number(match[1]) <= 23 && Number(match[2]) <= 59;
}

function minutesOf(value: string): number {
  const [h, m] = value.trim().split(":").map(Number);
  return h * 60 + m;
}

export function validateSettings(s: PostSettings): SettingsErrors {
  const errors: SettingsErrors = {};
  if (!SCHEDULE_KINDS.includes(s.scheduleKind)) {
    errors.scheduleKind = "Choose how often to post: every few minutes, fixed times or once a day.";
  }
  if (!Number.isInteger(s.intervalMinutes)) {
    errors.intervalMinutes = "The interval must be a number of minutes.";
  } else if (s.intervalMinutes < MIN_INTERVAL_MINUTES) {
    errors.intervalMinutes = `Post at most every ${MIN_INTERVAL_MINUTES} minutes (WhatsApp may block a busy number).`;
  }
  if (!isTime(s.windowStart)) errors.windowStart = "The window start must be a time like 08:00.";
  if (!isTime(s.windowEnd)) errors.windowEnd = "The window end must be a time like 08:00.";
  if (s.finalPostTime !== null && !isTime(s.finalPostTime)) {
    errors.finalPostTime = "The final post time must be a time like 08:00.";
  }
  if (!s.daysOfWeek.length || s.daysOfWeek.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
    errors.daysOfWeek = "Choose at least one day, Monday (0) to Sunday (6).";
  }
  if (s.fixedTimes.some((t) => !isTime(t))) errors.fixedTimes = "Each fixed time must be a time like 08:00.";
  if (s.introText.trim().length > TEXT_MAX) errors.introText = `Keep the intro and closing text under ${TEXT_MAX} characters.`;
  if (s.closingText.trim().length > TEXT_MAX) errors.closingText = `Keep the intro and closing text under ${TEXT_MAX} characters.`;

  // Cross-field rules (`check_schedule`), on the settings as they will stand.
  if (
    s.scheduleKind === "interval" &&
    !errors.windowStart &&
    !errors.windowEnd &&
    minutesOf(s.windowStart) >= minutesOf(s.windowEnd)
  ) {
    errors.windowEnd = "The window must start before it ends.";
  }
  if (s.scheduleKind === "fixed_times" && !s.fixedTimes.length) errors.fixedTimes = "Add at least one fixed time.";
  if (s.scheduleKind === "daily" && s.finalPostTime === null) {
    errors.finalPostTime = "Once a day needs the time of that post.";
  }
  return errors;
}

export function hasErrors(errors: SettingsErrors): boolean {
  return Object.keys(errors).length > 0;
}
