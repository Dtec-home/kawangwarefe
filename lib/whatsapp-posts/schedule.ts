/**
 * Plain-words summary of a totals-post schedule (WA-3, E8).
 *
 * Mirrors `fundraising/services/post_schedule.py`: interval slots every
 * `intervalMinutes` inside the window, fixed times, or once a day; plus the
 * final daily post (which always goes, even when "only when changed" is on).
 */

import type { PostSettings } from "./types";

export const WEEKDAYS = [
  { value: 0, short: "Mon", long: "Monday" },
  { value: 1, short: "Tue", long: "Tuesday" },
  { value: 2, short: "Wed", long: "Wednesday" },
  { value: 3, short: "Thu", long: "Thursday" },
  { value: 4, short: "Fri", long: "Friday" },
  { value: 5, short: "Sat", long: "Saturday" },
  { value: 6, short: "Sun", long: "Sunday" },
] as const;

export const SCHEDULE_KIND_LABELS = {
  interval: "Every N minutes in a window",
  fixed_times: "At fixed times",
  daily: "Once a day",
} as const;

/** "Hourly", "Every 2 hours", "Every 30 minutes". */
export function intervalPhrase(minutes: number): string {
  if (minutes === 60) return "Hourly";
  if (minutes > 60 && minutes % 60 === 0) return `Every ${minutes / 60} hours`;
  return `Every ${minutes} minutes`;
}

function sortedDays(days: number[]): number[] {
  return [...new Set(days)].sort((a, b) => a - b);
}

/** "Every day", "Monday to Friday", "Weekends", or "Mon, Wed, Fri". */
export function daysSummary(days: number[]): string {
  const list = sortedDays(days);
  const key = list.join(",");
  if (list.length === 0) return "No days";
  if (key === "0,1,2,3,4,5,6") return "Every day";
  if (key === "0,1,2,3,4") return "Monday to Friday";
  if (key === "5,6") return "Weekends";
  return list.map((d) => WEEKDAYS[d]?.short ?? String(d)).join(", ");
}

/** "12:00", "12:00 and 18:00", "12:00, 15:00 and 18:00". */
export function joinTimes(times: string[]): string {
  const list = [...new Set(times)].sort();
  if (list.length <= 1) return list.join("");
  return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}

/** One line, e.g. "Hourly 08:00–20:00 when something changed, plus 23:50". */
export function scheduleSummary(settings: PostSettings): string {
  const changed = settings.onlyWhenChanged ? " when something changed" : "";
  const plusFinal = settings.finalPostTime ? `, plus ${settings.finalPostTime}` : "";
  let text: string;
  if (settings.scheduleKind === "daily") {
    text = settings.finalPostTime ? `Once a day at ${settings.finalPostTime}` : "Once a day (choose the time)";
  } else if (settings.scheduleKind === "fixed_times") {
    text = settings.fixedTimes.length
      ? `At ${joinTimes(settings.fixedTimes)}${changed}${plusFinal}`
      : "No fixed times yet";
  } else {
    text = `${intervalPhrase(settings.intervalMinutes)} ${settings.windowStart}–${settings.windowEnd}${changed}${plusFinal}`;
  }
  const days = daysSummary(settings.daysOfWeek);
  if (days === "Every day") return text;
  return `${text}, ${/^[A-Z][a-z]{2}(,|$)/.test(days) ? `on ${days}` : days}`;
}
