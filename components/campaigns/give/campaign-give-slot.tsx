/**
 * CampaignGiveSlot — on /contribute?campaign=<slug>, shows the campaign give
 * panel instead of the general form (Fundraising S0 slot).
 *
 * Owned by lane S1-UI-B: build `CampaignGivePanel` (single-category STK push
 * with `campaignId`, plus Pay Bill instructions) and render it here when
 * `slug` is set. Until then the general form (`children`) is always shown.
 * The page wraps this in <Suspense fallback={children}> because it reads the
 * query string.
 */

"use client";

import { useSearchParams } from "next/navigation";

export function CampaignGiveSlot({ children }: { children: React.ReactNode }) {
  const slug = useSearchParams()?.get("campaign");
  void slug; // S1-UI-B: `if (slug) return <CampaignGivePanel slug={slug} />;`
  return <>{children}</>;
}
