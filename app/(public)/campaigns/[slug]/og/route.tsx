/**
 * The social preview image for /campaigns/[slug]: title and progress
 * (lane S2-UI-C, ticket 2.10). Falls back to a general card when the API
 * cannot be reached, so it never fails.
 *
 * A route rather than the file-based opengraph-image: the page's metadata
 * points here with ?v=<previewVersion> (DEPARTMENT_CAMPAIGNS D14), and the
 * image is never cached, so a preview always shows the current figures.
 */

import { ImageResponse } from "next/og";
import { fetchCampaignMeta } from "@/components/campaigns/public/server/campaign-meta";
import { CampaignOgCard } from "@/components/campaigns/public/server/campaign-og-card";

export const dynamic = "force-dynamic";

const SIZE = { width: 1200, height: 630 };

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = await fetchCampaignMeta(slug);
  return new ImageResponse(<CampaignOgCard meta={meta} />, {
    ...SIZE,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
