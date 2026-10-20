/**
 * /champion/[id] — a champion's own dashboard (donor names and amounts, decision 4). Owned by lane S5-UI-J.
 * S0 placeholder; the lane replaces this page.
 */

"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { MemberLayout } from "@/components/layouts/member-layout";
import { PlannedFeature } from "@/components/campaigns/shared/planned-feature";

export default function ChampionDashboardPage() {
  return (
    <ProtectedRoute>
      <MemberLayout>
        <PlannedFeature title="Champion dashboard" sprint="Sprint 5" />
      </MemberLayout>
    </ProtectedRoute>
  );
}
