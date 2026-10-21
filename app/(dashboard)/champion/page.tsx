/**
 * /champion — the member's champion pages and "Become a champion"
 * (Fundraising S5, lane S5-UI-J, ticket 5.9).
 */

"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { MyChampionshipsView } from "@/components/champions/dashboard/my-championships-view";
import { MemberLayout } from "@/components/layouts/member-layout";

export default function MyChampionPagesPage() {
  return (
    <ProtectedRoute>
      <MemberLayout>
        <MyChampionshipsView />
      </MemberLayout>
    </ProtectedRoute>
  );
}
