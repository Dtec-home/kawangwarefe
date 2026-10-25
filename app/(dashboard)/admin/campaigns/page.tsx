/**
 * /admin/campaigns — campaign list (Fundraising S1, ticket 1.9, lane S1-UI-A).
 */

"use client";

import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { CampaignList, NewCampaignButton } from "@/components/campaigns/admin/list/campaign-list";
import { PageHeader } from "@/components/ui/page-header";

export default function AdminCampaignsPage() {
  return (
    <AdminProtectedRoute requiredAccess="category-admin">
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader
            title="Campaigns"
            description="Fundraising drives with a target, a deadline and their own Pay Bill code."
            actions={<NewCampaignButton />}
          />
          <CampaignList />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
