/**
 * Receipt detail and print view (T1.8, RC-8) — /receipts/[number].
 *
 * Open to any signed-in user; the backend decides access (staff, the
 * recorder who issued it on the same day, or the owning member) and returns
 * null otherwise, which is shown as "not found or not accessible".
 */

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { ArrowLeft, Ban, Printer, ReceiptText } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { MemberLayout } from "@/components/layouts/member-layout";
import { ReceiptPrintStyles } from "@/components/receipts/receipt-print-styles";
import { ReceiptView } from "@/components/receipts/receipt-view";
import { VoidReceiptDialog } from "@/components/receipts/void-receipt-dialog";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { GET_RECEIPT, type ReceiptData } from "@/lib/graphql/receipt-queries";
import { useUserRole } from "@/lib/hooks/use-user-role";

const FALLBACK_CHURCH_NAME = "SDA Church Kawangware";

function ReceiptDetail() {
  const router = useRouter();
  const params = useParams<{ number: string }>();
  const number = decodeURIComponent(String(params?.number ?? ""));
  const { canVoidReceipts, isStaff, isRecorder, loading: roleLoading } = useUserRole();
  const [voidOpen, setVoidOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery<ReceiptData>(GET_RECEIPT, {
    variables: { number },
    skip: !number,
    fetchPolicy: "cache-and-network",
  });

  const receipt = data?.receipt ?? null;
  const churchName = data?.churchProfile?.displayName || FALLBACK_CHURCH_NAME;
  const Layout = isStaff || isRecorder ? AdminLayout : MemberLayout;

  let body: React.ReactNode;
  if ((loading && !data) || roleLoading) {
    body = (
      <div className="mx-auto max-w-sm space-y-3" data-testid="receipt-loading">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  } else if (!receipt) {
    body = (
      <Empty
        icon={ReceiptText}
        title="Receipt not found or not accessible"
        description={error ? error.message : `No receipt ${number} is available to you.`}
      />
    );
  } else {
    body = <ReceiptView receipt={receipt} churchName={churchName} />;
  }

  return (
    <Layout>
      <ReceiptPrintStyles />
      <div className="space-y-4">
        <div className="receipt-no-print flex flex-wrap items-center justify-between gap-2 print:hidden">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          {receipt && (
            <div className="flex items-center gap-2">
              {canVoidReceipts && receipt.status !== "void" && (
                <Button variant="outline" size="sm" className="text-destructive" onClick={() => setVoidOpen(true)}>
                  <Ban className="h-4 w-4 mr-2" />
                  Void
                </Button>
              )}
              <Button size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          )}
        </div>
        {body}
      </div>
      {receipt && canVoidReceipts && (
        <VoidReceiptDialog
          receipt={receipt}
          open={voidOpen}
          onOpenChange={setVoidOpen}
          onVoided={() => refetch()}
        />
      )}
    </Layout>
  );
}

export default function ReceiptPage() {
  return (
    <ProtectedRoute>
      <ReceiptDetail />
    </ProtectedRoute>
  );
}
