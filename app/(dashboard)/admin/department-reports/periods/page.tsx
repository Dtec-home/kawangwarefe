/**
 * /admin/department-reports/periods — reporting periods (DEPARTMENT_REPORTS, DR-8, US-1).
 *
 * Staff and the clerk (R4) can see the periods; only admins may open, edit or close them (the
 * server enforces it too: `ReportPermissions.can_manage_periods`).
 */

"use client";

import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { PeriodsManager } from "@/components/department-reports/staff/periods-manager";

export default function ReportingPeriodsPage() {
  return (
    <AdminProtectedRoute requiredAccess="reports-viewer">
      <AdminLayout>
        <PeriodsManager />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
