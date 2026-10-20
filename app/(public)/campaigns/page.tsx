/**
 * /campaigns — active public campaigns. Owned by lane S2-UI-C.
 * S0 placeholder; the lane replaces this page.
 */

import { Navigation } from "@/components/landing/navigation";
import { PlannedFeature } from "@/components/campaigns/shared/planned-feature";

export default function CampaignsPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container mx-auto px-4 py-12">
        <PlannedFeature title="Campaigns" sprint="Sprint 2" />
      </main>
    </div>
  );
}
