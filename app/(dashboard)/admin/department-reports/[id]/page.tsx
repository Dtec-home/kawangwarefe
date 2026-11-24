/**
 * /admin/department-reports/[id] — one department report (DEPARTMENT_REPORTS).
 *
 * Leaders write it here (DR-7 editor); staff read and review it through the
 * header's ReportActions (DR-8). The server decides what each viewer may do.
 */

"use client";

import { useParams } from "next/navigation";

import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { ReportPage } from "@/components/department-reports/editor/report-page";
import { AdminLayout } from "@/components/layouts/admin-layout";

export default function DepartmentReportPage() {
  const params = useParams<{ id: string }>();
  const reportId = String(params?.id ?? "");
  return (
    <AdminProtectedRoute requiredAccess="department-reports">
      <AdminLayout>
        <ReportPage key={reportId} reportId={reportId} />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
