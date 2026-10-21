/**
 * Server-side champion facts for link previews (lane S5-UI-I, ticket 5.7):
 * generateMetadata and the Open Graph image of /campaigns/[slug]/c/[code].
 *
 * Same pattern as S2's campaign-meta: a plain fetch, and any failure yields
 * null so the caller falls back to a general preview. Totals only.
 */

import type { Metadata } from "next";
import type { CampaignProgress, PublicCampaign, PublicChampion } from "@/lib/types/fundraising";
import { wholeKes } from "@/components/campaigns/public/server/campaign-meta";
import { championPath } from "../champion-format";

export type ChampionMeta = Pick<PublicChampion, "championName" | "code" | "raised" | "donorCount" | "personalTarget"> & {
  campaign: Pick<PublicCampaign, "slug" | "title" | "summary"> & {
    progress: Pick<CampaignProgress, "target" | "raised" | "percent">;
  };
};

const QUERY = `query PublicChampionMeta($slug: String!, $code: String!) {
  publicChampion(slug: $slug, code: $code) {
    championName
    code
    raised
    donorCount
    personalTarget
    campaign { slug title summary progress { target raised percent } }
  }
}`;

const DEFAULT_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:8000/graphql";

interface FetchOptions {
  fetchImpl?: typeof fetch;
  endpoint?: string;
  timeoutMs?: number;
  revalidate?: number;
}

export async function fetchChampionMeta(
  slug: string,
  code: string,
  { fetchImpl = fetch, endpoint = DEFAULT_ENDPOINT, timeoutMs = 3000, revalidate = 300 }: FetchOptions = {},
): Promise<ChampionMeta | null> {
  try {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { slug, code } }),
      signal: AbortSignal.timeout(timeoutMs),
      next: { revalidate },
    } as RequestInit);
    if (!response.ok) return null;
    const body = (await response.json()) as { data?: { publicChampion?: ChampionMeta | null }; errors?: unknown[] };
    if (body.errors?.length) return null;
    return body.data?.publicChampion ?? null;
  } catch {
    return null;
  }
}

const CHURCH = "SDA Church Kawangware";

export function championMetadata(slug: string, code: string, meta: ChampionMeta | null): Metadata {
  const path = championPath(slug, code);
  const title = meta ? `${meta.championName} for ${meta.campaign.title}` : "Campaign champion";
  const description = meta
    ? [
        `${meta.championName} has raised ${wholeKes(meta.raised)} for ${meta.campaign.title}.`,
        meta.campaign.summary?.trim(),
      ]
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
