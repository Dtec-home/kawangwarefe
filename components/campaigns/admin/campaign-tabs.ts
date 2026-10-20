/**
 * The tabs of /admin/campaigns/[id] (Fundraising S0 shell, Integrator-owned).
 * Each tab component belongs to one lane; see the page for the owners.
 * Kept out of page.tsx because a Next.js page may only export the page.
 */

import { CampaignOverview } from "@/components/campaigns/admin/campaign-overview";
import { ChampionsTab } from "@/components/campaigns/admin/champions/champions-tab";
import { CloseoutTab } from "@/components/campaigns/admin/closeout/closeout-tab";
import { StatementTab } from "@/components/campaigns/admin/statement/statement-tab";
import { UpdatesTab } from "@/components/campaigns/admin/updates/updates-tab";
import { WhatsAppShareTab } from "@/components/campaigns/admin/whatsapp-share/whatsapp-share-tab";
import { CampaignPledgesTab } from "@/components/pledges/admin/campaign-pledges-tab";

export const CAMPAIGN_TABS = [
  { value: "overview", label: "Overview", Component: CampaignOverview },
  { value: "updates", label: "Updates", Component: UpdatesTab },
  { value: "share", label: "Share list", Component: WhatsAppShareTab },
  { value: "pledges", label: "Pledges", Component: CampaignPledgesTab },
  { value: "statement", label: "Statement", Component: StatementTab },
  { value: "closeout", label: "Close out", Component: CloseoutTab },
  { value: "champions", label: "Champions", Component: ChampionsTab },
] as const;
