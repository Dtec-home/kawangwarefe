/**
 * Pure helpers for the champion public pages (lane S5-UI-I): names, the
 * personal-target percentage and the champion's share link.
 */

import { safeHttpUrl } from "@/components/campaigns/public/campaign-format";
import { SITE_URL } from "@/components/campaigns/public/share-message";

/** "Mary Wanjiku" → "Mary"; falls back to the whole name. */
export function firstName(fullName: string): string {
  const trimmed = fullName.trim();
  return trimmed.split(/\s+/)[0] || trimmed;
}

/** "Mary Wanjiku" → "MW"; at most two letters. */
export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return letters.map((p) => p[0]!.toUpperCase()).join("") || "?";
}

/** "9 donors", "1 donor". */
export function donorsLabel(count: number): string {
  return `${count} ${count === 1 ? "donor" : "donors"}`;
}

/**
 * Percent of the personal target raised, rounded; null when there is no
 * usable target.
 */
export function targetPercent(raised: string, target: string | null | undefined): number | null {
  const goal = Number.parseFloat(target ?? "");
  if (!Number.isFinite(goal) || goal <= 0) return null;
  const got = Number.parseFloat(raised);
  return Math.round(((Number.isFinite(got) ? got : 0) / goal) * 100);
}

/** The champion's page path. */
export function championPath(slug: string, code: string): string {
  return `/campaigns/${encodeURIComponent(slug)}/c/${encodeURIComponent(code)}`;
}

/** The server's public link for the champion, else one built from the site address. */
export function championShareUrl({
  slug,
  code,
  publicUrl,
}: {
  slug: string;
  code: string;
  publicUrl: string | null | undefined;
}): string {
  return safeHttpUrl(publicUrl) ?? `${SITE_URL}${championPath(slug, code)}`;
}

/** Decision 4: donors are told the champion sees their name and amount. */
export function championVisibilityNotice(championName: string): string {
  return `${firstName(championName)} can see your name and the amount you give.`;
}
