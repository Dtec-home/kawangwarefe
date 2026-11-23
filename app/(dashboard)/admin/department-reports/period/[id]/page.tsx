/**
 * /admin/department-reports/period/[id] — every department's report for one
 * period (DEPARTMENT_REPORTS, DR-8, US-8/US-12). Staff only.
 */

"use client";

import { useParams } from "next/navigation";

import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { PeriodTracker } from "@/components/department-reports/staff/period-tracker";

export default function DepartmentReportTrackerPage() {
  const params = useParams<{ id: string }>();
  const periodId = String(params?.id ?? "");
  return (
    <AdminProtectedRoute requiredAccess="staff">
      <AdminLayout>
        <PeriodTracker periodId={periodId} />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
