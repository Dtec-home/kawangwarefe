/**
 * /champion/[id] — a champion's own dashboard: their tally, their donors with
 * names and amounts (decision 4) and their share kit (Fundraising S5, lane
 * S5-UI-J, ticket 5.9).
 */

"use client";

import { useParams } from "next/navigation";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { ChampionDashboardView } from "@/components/champions/dashboard/champion-dashboard-view";
import { MemberLayout } from "@/components/layouts/member-layout";

export default function ChampionDashboardPage() {
  const params = useParams<{ id: string }>();
  return (
    <ProtectedRoute>
      <MemberLayout>
        <ChampionDashboardView championId={String(params?.id ?? "")} />
      </MemberLayout>
    </ProtectedRoute>
  );
}
