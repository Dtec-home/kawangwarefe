/**
 * /admin/pledges — the pledge register (Fundraising S3, lane S3-UI-F, ticket 3.11).
 *
 * Staff see every pledge; a category admin sees their own departments only
 * (the backend enforces it, the filters offer only those departments).
 */

"use client";

import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { PledgeRegister } from "@/components/pledges/admin/pledge-register";
import { PageHeader } from "@/components/ui/page-header";

export default function AdminPledgesPage() {
  return (
    <AdminProtectedRoute requiredAccess="category-admin">
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader title="Pledges" description="Who pledged what, what has been paid, and what is outstanding." />
          <PledgeRegister />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
