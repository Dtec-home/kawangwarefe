/**
 * /admin/pledges — pledge register. Owned by lane S3-UI-F.
 * S0 placeholder; the lane replaces this page.
 */

"use client";

import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { PlannedFeature } from "@/components/campaigns/shared/planned-feature";
import { PageHeader } from "@/components/ui/page-header";

export default function AdminPledgesPage() {
  return (
    <AdminProtectedRoute requiredAccess="category-admin">
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader title="Pledges" description="Who pledged what, what has been paid, and what is outstanding." />
          <PlannedFeature title="Pledges" sprint="Sprint 3" />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
