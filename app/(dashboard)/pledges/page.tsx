/**
 * /pledges — the member's own pledges. Owned by lane S3-UI-E.
 * S0 placeholder; the lane replaces this page.
 */

"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { MemberLayout } from "@/components/layouts/member-layout";
import { PlannedFeature } from "@/components/campaigns/shared/planned-feature";

export default function MyPledgesPage() {
  return (
    <ProtectedRoute>
      <MemberLayout>
        <PlannedFeature title="My pledges" sprint="Sprint 3" />
      </MemberLayout>
    </ProtectedRoute>
  );
}
