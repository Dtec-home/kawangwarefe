/**
 * The social preview image for /campaigns/[slug]: title and progress
 * (lane S2-UI-C, ticket 2.10). Falls back to a general card when the API
 * cannot be reached, so it never fails.
 */

import { ImageResponse } from "next/og";
import { fetchCampaignMeta } from "@/components/campaigns/public/server/campaign-meta";
import { CampaignOgCard } from "@/components/campaigns/public/server/campaign-og-card";

export const alt = "Fundraising campaign at SDA Church Kawangware";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = await fetchCampaignMeta(slug);
  return new ImageResponse(<CampaignOgCard meta={meta} />, size);
}
