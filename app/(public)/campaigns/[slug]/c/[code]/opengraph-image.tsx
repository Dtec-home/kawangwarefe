/**
 * The social preview image for a champion's page (lane S5-UI-I). Falls back
 * to a general card when the API cannot be reached, so it never fails.
 */

import { ImageResponse } from "next/og";
import { fetchChampionMeta } from "@/components/champions/public/server/champion-meta";
import { ChampionOgCard } from "@/components/champions/public/server/champion-og-card";

export const alt = "A champion raising funds at SDA Church Kawangware";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string; code: string }> }) {
  const { slug, code } = await params;
  const meta = await fetchChampionMeta(slug, code);
  return new ImageResponse(<ChampionOgCard meta={meta} />, size);
}
