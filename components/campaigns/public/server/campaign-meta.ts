/**
 * Server-side campaign facts for link previews (lane S2-UI-C, ticket 2.10):
 * generateMetadata and the Open Graph image (/campaigns/[slug]/og).
 *
 * A plain fetch to the same GraphQL endpoint the Apollo client uses; any
 * failure (API down, unknown slug, bad reply) yields null and the caller
 * falls back to a general preview, so a preview never breaks the page.
 * Totals only, never donor names.
 *
 * Previews must tell the same story as the WhatsApp leaderboard post
 * (DEPARTMENT_CAMPAIGNS D14): the figures are fetched fresh every time (never
 * cached here), with the server's PREVIEW_FETCH_TOKEN so the public rate limit
 * never strips them; the wording is the post's ("Raised: KES … (…%)",
 * "Target: KES …"); and the image URL carries the campaign's preview version,
 * as the shared link does, so WhatsApp fetches a new image when figures change.
 */

import type { Metadata } from "next";
import type { CampaignProgress, PublicCampaign } from "@/lib/types/fundraising";

export type CampaignMeta = Pick<PublicCampaign, "slug" | "title" | "summary" | "daysLeft" | "previewVersion"> & {
  progress: Pick<CampaignProgress, "target" | "raised" | "percent" | "donorCount">;
};

const QUERY = `query PublicCampaignMeta($slug: String!) {
  publicCampaign(slug: $slug) {
    slug
    title
    summary
    daysLeft
    previewVersion
    progress { target raised percent donorCount }
  }
}`;

const DEFAULT_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:8000/graphql";

interface FetchOptions {
  fetchImpl?: typeof fetch;
  endpoint?: string;
  timeoutMs?: number;
  /** Server-only secret shared with the backend (never NEXT_PUBLIC_). */
  previewToken?: string;
}

/** Headers for a server-side preview fetch: the token lets it past the public rate limit. */
export function previewFetchHeaders(previewToken = process.env.PREVIEW_FETCH_TOKEN ?? ""): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(previewToken ? { "X-Preview-Token": previewToken } : {}),
  };
}

export async function fetchCampaignMeta(
  slug: string,
  { fetchImpl = fetch, endpoint = DEFAULT_ENDPOINT, timeoutMs = 3000, previewToken }: FetchOptions = {},
): Promise<CampaignMeta | null> {
  try {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: previewFetchHeaders(previewToken),
      body: JSON.stringify({ query: QUERY, variables: { slug } }),
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { data?: { publicCampaign?: CampaignMeta | null }; errors?: unknown[] };
    if (body.errors?.length) return null;
    return body.data?.publicCampaign ?? null;
  } catch {
    return null;
  }
}

/** "KES 24,800" — whole shillings, for previews where space is short. */
export function wholeKes(amount: string | number): string {
  const value = typeof amount === "number" ? amount : Number.parseFloat(amount);
  return `KES ${Math.round(Number.isFinite(value) ? value : 0).toLocaleString("en-KE")}`;
}

const CHURCH = "SDA Church Kawangware";
const FALLBACK_DESCRIPTION = `Give towards a fundraising campaign at ${CHURCH}. See the latest totals on the campaign page.`;

/** "28 Oct, 6:05pm" in Nairobi: the leaderboard's "as at" wording. */
export function asAt(moment: Date): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Africa/Nairobi",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
      .formatToParts(moment)
      .map((part) => [part.type, part.value]),
  );
  const minutes = parts.minute === "00" ? "" : `:${parts.minute}`;
  return `${parts.day} ${parts.month}, ${parts.hour}${minutes}${String(parts.dayPeriod).toLowerCase()}`;
}

/** The leaderboard post's header, as one preview line. */
export function previewDescription(meta: CampaignMeta, now: Date = new Date()): string {
  const { raised, target, percent, donorCount } = meta.progress;
  const givers = `${donorCount} ${donorCount === 1 ? "giver" : "givers"}`;
  const figures = `Raised: ${wholeKes(raised)} (${Number(percent).toFixed(1)}%) · Target: ${wholeKes(target)} · ${givers} · as at ${asAt(now)}.`;
  return [figures, meta.summary?.trim()].filter(Boolean).join(" ");
}

/** The preview image, versioned like the shared link so a cached image is never reused for new figures. */
export function previewImagePath(slug: string, meta: CampaignMeta | null): string {
  const path = `/campaigns/${encodeURIComponent(slug)}/og`;
  return meta?.previewVersion ? `${path}?v=${encodeURIComponent(meta.previewVersion)}` : path;
}

export function campaignMetadata(slug: string, meta: CampaignMeta | null, now: Date = new Date()): Metadata {
  const path = `/campaigns/${encodeURIComponent(slug)}`;
  const title = meta?.title ?? "Campaign";
  const description = meta ? previewDescription(meta, now) : FALLBACK_DESCRIPTION;
  const images = [{ url: previewImagePath(slug, meta), width: 1200, height: 630, alt: title }];
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", url: path, siteName: CHURCH, title, description, images },
    twitter: { card: "summary_large_image", title, description, images },
  };
}
