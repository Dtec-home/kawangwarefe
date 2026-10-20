/**
 * ConfirmationCampaignShare — after giving to a campaign, invite the giver to
 * share it (Fundraising S0 slot on /confirmation).
 *
 * Owned by lane S2-UI-C. The campaign give panel (S1-UI-B) sends givers to
 * /confirmation?...&campaign=<slug>; render a card with the campaign's
 * ShareBar when `slug` is set. Renders nothing until then. The confirmation
 * page already sits inside a Suspense boundary.
 */

"use client";

import { useSearchParams } from "next/navigation";

export function ConfirmationCampaignShare() {
  const slug = useSearchParams()?.get("campaign");
  void slug;
  return null;
}
