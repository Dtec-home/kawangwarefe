/**
 * /admin/transfers — Fund transfers (DEPARTMENT_REPORTS US-16, US-17; FT-2).
 *
 * Staff and department leaders, the same people the backend lets through its
 * fail-closed door (FundTransferPermissions.may_enter). Members and pure
 * recorders are redirected by AdminProtectedRoute.
 */

"use client";

import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { FundTransfersView } from "@/components/fund-transfers/fund-transfers-view";
import { AdminLayout } from "@/components/layouts/admin-layout";

export default function FundTransfersPage() {
  return (
    <AdminProtectedRoute requiredAccess="department-reports">
      <AdminLayout>
        <FundTransfersView />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
