/**
 * /admin/department-reports — "My reports" (DEPARTMENT_REPORTS US-2, DR-7).
 *
 * One card per department the leader leads, for the open reporting period.
 * Guarded like the other department-leader pages (leaders and staff); staff
 * also get links to the tracker and the reporting periods (DR-8).
 */

"use client";

import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { MyReports } from "@/components/department-reports/editor/my-reports";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { PageHeader } from "@/components/ui/page-header";

export default function DepartmentReportsPage() {
  return (
    <AdminProtectedRoute requiredAccess="department-reports">
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader
            title="Department Reports"
            description="Your department's yearly report: write it section by section, preview it and hand it in."
          />
          <MyReports />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
