/**
 * Recorder workspace `/record` (T2.5).
 *
 * Reachable by staff and recorders (RR-9, RR-4). Pure recorders land here
 * after login and are sent back here from admin routes.
 */

"use client";

import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { RecorderWorkspace } from "@/components/recorder/recorder-workspace";

export default function RecordGivingPage() {
  return (
    <AdminProtectedRoute requiredAccess="recorder">
      <AdminLayout>
        <RecorderWorkspace />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
