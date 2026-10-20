/**
 * /admin/campaigns/new — create a campaign. Owned by lane S1-UI-A.
 * S0 placeholder; the lane replaces this page.
 */

"use client";

import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { PlannedFeature } from "@/components/campaigns/shared/planned-feature";
import { PageHeader } from "@/components/ui/page-header";

export default function NewCampaignPage() {
  return (
    <AdminProtectedRoute requiredAccess="category-admin">
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader title="New campaign" description="Draft a campaign; another admin or pastor approves it before it goes public." />
          <PlannedFeature title="New campaign" sprint="Sprint 1" />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
