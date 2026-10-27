/**
 * /campaigns/[slug]/c/[code] — a champion's public page (lane S5-UI-I,
 * ticket 5.7): the champion's totals, the campaign's progress and a give
 * panel that carries the champion's code.
 */

import type { Metadata } from "next";
import { ChampionPageView } from "@/components/champions/public/champion-page-view";
import { championMetadata, fetchChampionMeta } from "@/components/champions/public/server/champion-meta";

interface ChampionPageProps {
  params: Promise<{ slug: string; code: string }>;
}

/** Title, description, canonical, Open Graph and X card; falls back if the API is down. */
export async function generateMetadata({ params }: ChampionPageProps): Promise<Metadata> {
  const { slug, code } = await params;
  return championMetadata(slug, code, await fetchChampionMeta(slug, code));
}

export default async function ChampionPage({ params }: ChampionPageProps) {
  const { slug, code } = await params;
  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-6 sm:py-10">
        <div className="mx-auto max-w-6xl">
          <ChampionPageView slug={slug} code={code} />
        </div>
      </main>
    </div>
  );
}
