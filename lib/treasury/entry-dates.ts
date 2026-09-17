/**
 * Date helpers for entry dates (D18: the Nairobi local date decides the day).
 */

export const CHURCH_TIME_ZONE = "Africa/Nairobi";

/** Today's date in Nairobi as YYYY-MM-DD. */
export function nairobiToday(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CHURCH_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** The day before an ISO date (YYYY-MM-DD). */
export function previousDay(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** "Sat, 29 Aug 2026" for an ISO date, independent of the viewer's time zone. */
export function formatEntryDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "Expires in 5h 12m" / "Expires in 12m" / "Expired". */
export function formatExpiresIn(expiresAt: string, now: Date = new Date()): string {
  const ms = new Date(expiresAt).getTime() - now.getTime();
  if (!Number.isFinite(ms) || ms <= 0) return "Expired";
  const totalMinutes = Math.max(1, Math.floor(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `Expires in ${minutes}m`;
  return `Expires in ${hours}h ${minutes}m`;
}
