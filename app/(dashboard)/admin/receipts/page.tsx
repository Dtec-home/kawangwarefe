/**
 * Receipts (T1.8 / T2.6) — /admin/receipts, staff only.
 *
 * "Register" lists every receipt. Treasurers and admins (`canVoidReceipts`)
 * also get a "Void requests" tab; `?tab=void-requests` opens it directly.
 */

"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { ReceiptRegister } from "@/components/receipts/receipt-register";
import { VoidRequestsInbox } from "@/components/receipts/void-requests-inbox";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePendingVoidRequestCount } from "@/lib/hooks/use-pending-void-request-count";
import { useUserRole } from "@/lib/hooks/use-user-role";

const REGISTER_TAB = "register";
const VOID_REQUESTS_TAB = "void-requests";

function ReceiptsPageContent() {
  const searchParams = useSearchParams();
  const { canVoidReceipts } = useUserRole();
  const pendingCount = usePendingVoidRequestCount({ enabled: canVoidReceipts });
  const [tab, setTab] = useState(() =>
    searchParams?.get("tab") === VOID_REQUESTS_TAB ? VOID_REQUESTS_TAB : REGISTER_TAB
  );
  const activeTab = canVoidReceipts ? tab : REGISTER_TAB;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader title="Receipts" description="Every receipt issued, by date, channel and status." />
        {canVoidReceipts ? (
          <Tabs value={activeTab} onValueChange={setTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value={REGISTER_TAB}>Register</TabsTrigger>
              <TabsTrigger value={VOID_REQUESTS_TAB}>
                Void requests
                {pendingCount > 0 && (
                  <span
                    className="ml-2 rounded-full bg-destructive px-1.5 text-xs font-semibold text-white"
                    aria-label={`${pendingCount} pending`}
                  >
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value={REGISTER_TAB}>
              <ReceiptRegister />
            </TabsContent>
            <TabsContent value={VOID_REQUESTS_TAB}>
              <VoidRequestsInbox />
            </TabsContent>
          </Tabs>
        ) : (
          <ReceiptRegister />
        )}
      </div>
    </AdminLayout>
  );
}

export default function ReceiptsPage() {
  return (
    <AdminProtectedRoute requiredAccess="staff">
      <Suspense fallback={null}>
        <ReceiptsPageContent />
      </Suspense>
    </AdminProtectedRoute>
  );
}
