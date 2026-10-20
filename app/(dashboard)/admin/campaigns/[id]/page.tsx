/**
 * /admin/campaigns/[id] — one campaign, as tabs (Fundraising S0 shell).
 *
 * Owned by the Integrator. Every tab is a component owned by one lane, so
 * lanes never edit this file:
 *   Overview   — S1-UI-A  components/campaigns/admin/campaign-overview.tsx
 *   Updates    — S2-UI-D  components/campaigns/admin/updates/updates-tab.tsx
 *   Share list — S2-UI-D  components/campaigns/admin/whatsapp-share/whatsapp-share-tab.tsx
 *   Pledges    — S3-UI-F  components/pledges/admin/campaign-pledges-tab.tsx
 *   Statement  — S4-UI-G  components/campaigns/admin/statement/statement-tab.tsx
 *   Close out  — S4-UI-H  components/campaigns/admin/closeout/closeout-tab.tsx
 *   Champions  — S5-UI-J  components/campaigns/admin/champions/champions-tab.tsx
 */

"use client";

import { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { CampaignOverview } from "@/components/campaigns/admin/campaign-overview";
import { ChampionsTab } from "@/components/campaigns/admin/champions/champions-tab";
import { CloseoutTab } from "@/components/campaigns/admin/closeout/closeout-tab";
import { StatementTab } from "@/components/campaigns/admin/statement/statement-tab";
import { UpdatesTab } from "@/components/campaigns/admin/updates/updates-tab";
import { WhatsAppShareTab } from "@/components/campaigns/admin/whatsapp-share/whatsapp-share-tab";
import { CampaignPledgesTab } from "@/components/pledges/admin/campaign-pledges-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const CAMPAIGN_TABS = [
  { value: "overview", label: "Overview", Component: CampaignOverview },
  { value: "updates", label: "Updates", Component: UpdatesTab },
  { value: "share", label: "Share list", Component: WhatsAppShareTab },
  { value: "pledges", label: "Pledges", Component: CampaignPledgesTab },
  { value: "statement", label: "Statement", Component: StatementTab },
  { value: "closeout", label: "Close out", Component: CloseoutTab },
  { value: "champions", label: "Champions", Component: ChampionsTab },
] as const;

function CampaignPageContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const campaignId = String(params?.id ?? "");
  const requested = searchParams?.get("tab");
  const tab = CAMPAIGN_TABS.some((t) => t.value === requested) ? String(requested) : "overview";

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => router.replace(`/admin/campaigns/${campaignId}?tab=${value}`)}
      className="space-y-4"
    >
      <TabsList className="flex-wrap h-auto">
        {CAMPAIGN_TABS.map(({ value, label }) => (
          <TabsTrigger key={value} value={value}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {CAMPAIGN_TABS.map(({ value, Component }) => (
        <TabsContent key={value} value={value}>
          <Component campaignId={campaignId} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

export default function AdminCampaignPage() {
  return (
    <AdminProtectedRoute requiredAccess="category-admin">
      <AdminLayout>
        <Suspense fallback={null}>
          <CampaignPageContent />
        </Suspense>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
