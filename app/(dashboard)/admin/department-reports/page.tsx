/**
 * /admin/department-reports — yearly department reports (DEPARTMENT_REPORTS).
 *
 * DR-6 placeholder: DR-7 replaces it with "My reports" for leaders. Guarded
 * like the other department-leader pages (category admins and staff).
 */

"use client";

import { ClipboardList } from "lucide-react";

import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/page-header";

export default function DepartmentReportsPage() {
  return (
    <AdminProtectedRoute requiredAccess="department-reports">
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader
            title="Department Reports"
            description="Each department's yearly report: introduction, leaders, objectives, achievements and the money from the books."
          />
          <Card>
            <CardContent>
              <Empty
                icon={ClipboardList}
                title="Department reports are coming soon"
                description="You'll write and hand in your department's yearly report here."
              />
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
