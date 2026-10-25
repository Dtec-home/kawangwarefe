/**
 * CampaignGiveSlot — on /contribute?campaign=<slug>, shows the campaign give
 * panel instead of the general form (Fundraising S0 slot, filled by S1-UI-B).
 *
 * The page wraps this in <Suspense fallback={children}> because it reads the
 * query string.
 */

"use client";

import { useSearchParams } from "next/navigation";
import { CampaignGivePanel } from "./campaign-give-panel";

export function CampaignGiveSlot({ children }: { children: React.ReactNode }) {
  const slug = useSearchParams()?.get("campaign")?.trim();
  if (slug) return <CampaignGivePanel slug={slug} />;
  return <>{children}</>;
}
