/**
 * /campaigns/[slug]/c/[code] — a champion's public page. Owned by lane S5-UI-I.
 * S0 placeholder; the lane replaces this page.
 */

import { Navigation } from "@/components/landing/navigation";
import { PlannedFeature } from "@/components/campaigns/shared/planned-feature";

export default function ChampionPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container mx-auto px-4 py-12">
        <PlannedFeature title="Champion" sprint="Sprint 5" />
      </main>
    </div>
  );
}
