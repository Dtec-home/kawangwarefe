/**
 * Recorder workspace — placeholder (T2.4).
 *
 * Reachable by staff and recorders. The real workspace (T2.5) replaces the
 * body of this page.
 */

"use client";

import { NotebookPen } from "lucide-react";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { PageHeader } from "@/components/ui/page-header";
import { Empty } from "@/components/ui/empty";

export default function RecordGivingPage() {
  return (
    <AdminProtectedRoute requiredAccess="recorder">
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader title="Record giving" description="Record cash and envelope giving." />
          <Empty icon={NotebookPen} title="Recording workspace coming soon" />
        </div>
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
