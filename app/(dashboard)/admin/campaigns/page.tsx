/**
 * /admin/campaigns — campaign list. Owned by lane S1-UI-A.
 * S0 placeholder; the lane replaces this page.
 */

"use client";

import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { PlannedFeature } from "@/components/campaigns/shared/planned-feature";
import { PageHeader } from "@/components/ui/page-header";

export default function AdminCampaignsPage() {
  return (
    <AdminProtectedRoute requiredAccess="category-admin">
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader title="Campaigns" description="Fundraising drives with a target, a deadline and their own Pay Bill code." />
          <PlannedFeature title="Campaigns" sprint="Sprint 1" />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
