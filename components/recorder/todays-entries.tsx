/**
 * Today's entries for the recorder (T2.5, RR-5): the receipts the signed-in
 * user issued today, with reprint, resend SMS and request void.
 */

"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { Ban, MessageSquare, Printer, ReceiptText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { ReceiptStatusBadge } from "@/components/receipts/receipt-badges";
import { RequestVoidDialog } from "@/components/recorder/request-void-dialog";
import {
  RESEND_RECEIPT_SMS,
  type MyRecordedReceiptsData,
  type ResendReceiptSmsData,
  type ResendReceiptSmsVars,
} from "@/lib/graphql/recorder-queries";
import type { Receipt } from "@/lib/graphql/receipt-queries";
import { formatKes, receiptChannelLabel, receiptGiver, receiptHref } from "@/lib/receipts/format";

/** "14:05" in Nairobi time. */
function nairobiTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    timeZone: "Africa/Nairobi",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** A walk-in receipt carries a free-text giver name and has no phone. */
export function isWalkInReceipt(receipt: Pick<Receipt, "giverName">): boolean {
  return !!receipt.giverName;
}

interface TodaysEntriesProps {
  data: MyRecordedReceiptsData["myRecordedReceipts"] | undefined;
  loading: boolean;
  error?: Error | null;
  onChanged?: () => void;
}

export function TodaysEntries({ data, loading, error, onChanged }: TodaysEntriesProps) {
  const [resendsLeft, setResendsLeft] = useState<Record<string, number>>({});
  const [voidRequested, setVoidRequested] = useState<Record<string, boolean>>({});
  const [voidTarget, setVoidTarget] = useState<string | null>(null);
  const [resending, setResending] = useState<string | null>(null);
  const [resend] = useMutation<ResendReceiptSmsData, ResendReceiptSmsVars>(RESEND_RECEIPT_SMS);

  const handleResend = async (receiptNumber: string) => {
    if (resending) return;
    setResending(receiptNumber);
    try {
      const { data: result } = await resend({ variables: { receiptNumber } });
      const payload = result?.resendReceiptSms;
      if (payload?.success) {
        if (typeof payload.resendsRemaining === "number") {
          const remaining = payload.resendsRemaining;
          setResendsLeft((prev) => ({ ...prev, [receiptNumber]: remaining }));
        }
        toast.success(payload.message || `Receipt ${receiptNumber} SMS queued`);
      } else {
        toast.error(payload?.message || "Could not resend the SMS");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resend the SMS");
    } finally {
      setResending(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    );
  }

  if (error && !data) {
    return <Empty icon={ReceiptText} title="Could not load today's entries" description={error.message} />;
  }

  const items = data?.items ?? [];

  return (
    <div className="space-y-4">
      <div
        className="grid grid-cols-2 gap-3 rounded-xl border bg-card p-4 shadow-sm"
        data-testid="todays-summary"
      >
        <div>
          <p className="text-xs text-muted-foreground">Receipts</p>
          <p className="text-xl font-semibold tabular-nums">{data?.count ?? 0}</p>
          {(data?.voidCount ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground">{data?.voidCount} void</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total recorded</p>
          <p className="text-xl font-semibold tabular-nums">{formatKes(data?.totalAmount ?? "0")}</p>
          <p className="text-xs text-muted-foreground">excluding void</p>
        </div>
      </div>

      {items.length === 0 ? (
        <Empty
          icon={ReceiptText}
          title="No entries yet today"
          description="Receipts you record today appear here."
        />
      ) : (
        <ul className="space-y-3" aria-label="Today's receipts">
          {items.map((item) => {
            const isVoid = item.status === "void";
            const walkIn = isWalkInReceipt(item);
            const left = resendsLeft[item.number];
            const requested = voidRequested[item.number];
            return (
              <li
                key={item.id}
                className="rounded-xl border bg-card p-4 shadow-sm space-y-3"
                data-testid={`entry-${item.number}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-base font-semibold">{item.number}</p>
                    <p className="truncate text-sm">{receiptGiver(item)}</p>
                    <p className="text-xs text-muted-foreground">
                      {nairobiTime(item.createdAt)} · {receiptChannelLabel(item.channel)}
                      {walkIn ? " · walk-in" : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right space-y-1">
                    <p
                      className={`font-semibold tabular-nums ${isVoid ? "line-through text-muted-foreground" : ""}`}
                    >
                      {formatKes(item.totalAmount)}
                    </p>
                    {isVoid ? (
                      <ReceiptStatusBadge status="void" />
                    ) : requested ? (
                      <StatusBadge variant="warning">Void requested</StatusBadge>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm" className="h-9">
                    <a href={receiptHref(item.number)} target="_blank" rel="noopener noreferrer">
                      <Printer className="h-4 w-4 mr-1.5" />
                      Print
                    </a>
                  </Button>
                  {!isVoid && !walkIn && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9"
                      onClick={() => handleResend(item.number)}
                      disabled={resending === item.number || left === 0}
                    >
                      <MessageSquare className="h-4 w-4 mr-1.5" />
                      Resend SMS{typeof left === "number" ? ` (${left} left)` : ""}
                    </Button>
                  )}
                  {!isVoid && !requested && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setVoidTarget(item.number)}
                    >
                      <Ban className="h-4 w-4 mr-1.5" />
                      Request void
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <RequestVoidDialog
        receiptNumber={voidTarget}
        open={voidTarget !== null}
        onOpenChange={(open) => !open && setVoidTarget(null)}
        onRequested={(number) => {
          setVoidRequested((prev) => ({ ...prev, [number]: true }));
          onChanged?.();
        }}
      />
    </div>
  );
}
