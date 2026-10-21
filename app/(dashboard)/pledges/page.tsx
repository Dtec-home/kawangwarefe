/**
 * /pledges — the member's own pledges (Fundraising S3, lane S3-UI-E, 3.8).
 */

"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { MemberLayout } from "@/components/layouts/member-layout";
import { MyPledgesView } from "@/components/pledges/member/my-pledges-view";

export default function MyPledgesPage() {
  return (
    <ProtectedRoute>
      <MemberLayout>
        <MyPledgesView />
      </MemberLayout>
    </ProtectedRoute>
  );
}
