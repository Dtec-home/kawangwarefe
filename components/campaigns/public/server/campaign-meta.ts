/**
 * Server-side campaign facts for link previews (lane S2-UI-C, ticket 2.10):
 * generateMetadata and the generated Open Graph image.
 *
 * A plain fetch to the same GraphQL endpoint the Apollo client uses; any
 * failure (API down at build or request time, unknown slug, bad reply)
 * yields null and the caller falls back to a general preview, so a preview
 * never breaks the page or the build. Totals only, never donor names.
 */

import type { Metadata } from "next";
import type { CampaignProgress, PublicCampaign } from "@/lib/types/fundraising";

export type CampaignMeta = Pick<PublicCampaign, "slug" | "title" | "summary" | "daysLeft"> & {
  progress: Pick<CampaignProgress, "target" | "raised" | "percent" | "donorCount">;
};

const QUERY = `query PublicCampaignMeta($slug: String!) {
  publicCampaign(slug: $slug) {
    slug
    title
    summary
    daysLeft
    progress { target raised percent donorCount }
  }
}`;

const DEFAULT_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:8000/graphql";

interface FetchOptions {
  fetchImpl?: typeof fetch;
  endpoint?: string;
  timeoutMs?: number;
  /** Seconds Next may reuse the answer for. */
  revalidate?: number;
}

export async function fetchCampaignMeta(
  slug: string,
  { fetchImpl = fetch, endpoint = DEFAULT_ENDPOINT, timeoutMs = 3000, revalidate = 300 }: FetchOptions = {},
): Promise<CampaignMeta | null> {
  try {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { slug } }),
      signal: AbortSignal.timeout(timeoutMs),
      next: { revalidate },
    } as RequestInit);
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

export function campaignMetadata(slug: string, meta: CampaignMeta | null): Metadata {
  const path = `/campaigns/${encodeURIComponent(slug)}`;
  const title = meta?.title ?? "Campaign";
  const description = meta
    ? [`${wholeKes(meta.progress.raised)} raised of ${wholeKes(meta.progress.target)}.`, meta.summary?.trim()]
        .filter(Boolean)
        .join(" ")
    : `Give towards a fundraising campaign at ${CHURCH}.`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", url: path, siteName: CHURCH, title, description },
    twitter: { card: "summary_large_image", title, description },
  };
}
