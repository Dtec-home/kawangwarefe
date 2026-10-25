/**
 * Pure helpers for the public campaign pages (lane S2-UI-C): wording for the
 * days left, story paragraphs, and validation of the image and video links
 * staff type in (images are URLs, decision 9), so nothing unsafe reaches an
 * `src` attribute.
 */

/** "12 days left", "Last day", "Ended"; null when the campaign has no end date. */
export function daysLeftLabel(daysLeft: number | null | undefined): string | null {
  if (daysLeft === null || daysLeft === undefined) return null;
  if (daysLeft < 0) return "Ended";
  if (daysLeft === 0) return "Last day";
  return `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`;
}

/** Plain-text story → paragraphs (split on blank lines). Never parsed as HTML. */
export function storyParagraphs(story: string | null | undefined): string[] {
  return (story ?? "")
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** The URL if it is an absolute http(s) link, else null. */
export function safeHttpUrl(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

/** The 11-character video id from a YouTube link (or a bare id), else null. */
export function youtubeId(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim();
  if (YOUTUBE_ID.test(value)) return value;
  const href = safeHttpUrl(value);
  if (!href) return null;
  const url = new URL(href);
  let candidate: string | null = null;
  if (url.hostname === "youtu.be") {
    candidate = url.pathname.split("/")[1] ?? null;
  } else if (YOUTUBE_HOSTS.has(url.hostname)) {
    const [, first, second] = url.pathname.split("/");
    if (first === "watch") candidate = url.searchParams.get("v");
    else if (first === "embed" || first === "shorts" || first === "live") candidate = second ?? null;
  }
  return candidate && YOUTUBE_ID.test(candidate) ? candidate : null;
}

/** The privacy-enhanced embed address for a validated video id. */
export function youtubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}`;
}

/** Updates newest first; undated ones last. Does not mutate the input. */
export function newestFirst<T extends { publishedAt: string | null }>(updates: readonly T[]): T[] {
  const time = (u: T) => (u.publishedAt ? Date.parse(u.publishedAt) || 0 : -Infinity);
  return [...updates].sort((a, b) => time(b) - time(a));
}

/** "15 Oct 2026" in Nairobi time. */
export function formatUpdateDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Nairobi",
  });
}
