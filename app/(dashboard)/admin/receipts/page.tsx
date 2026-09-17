/**
 * Receipts (T1.8 / T2.6) — /admin/receipts, staff only.
 */

"use client";

import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { ReceiptRegister } from "@/components/receipts/receipt-register";
import { PageHeader } from "@/components/ui/page-header";

function ReceiptsPageContent() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader title="Receipts" description="Every receipt issued, by date, channel and status." />
        <ReceiptRegister />
      </div>
    </AdminLayout>
  );
}

export default function ReceiptsPage() {
  return (
    <AdminProtectedRoute requiredAccess="staff">
      <ReceiptsPageContent />
    </AdminProtectedRoute>
  );
}
