/**
 * /admin/campaigns/new — create a campaign (Fundraising S1, ticket 1.10, lane S1-UI-A).
 */

"use client";

import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { CreateCampaign } from "@/components/campaigns/admin/form/create-campaign";
import { PageHeader } from "@/components/ui/page-header";

export default function NewCampaignPage() {
  return (
    <AdminProtectedRoute requiredAccess="category-admin">
      <AdminLayout>
        <div className="mx-auto max-w-3xl space-y-6">
          <PageHeader
            title="New campaign"
            description="Draft a campaign; another admin or pastor approves it before it goes public."
          />
          <CreateCampaign />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
