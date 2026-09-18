/**
 * Small badges shared by the receipt register and detail page (T1.8).
 */

import { StatusBadge } from "@/components/ui/status-badge";
import { RoleBadge } from "@/components/ui/status-badge";
import { receiptChannelLabel } from "@/lib/receipts/format";

export function ReceiptChannelBadge({ channel }: { channel: string }) {
  const tone = channel.startsWith("mpesa") ? "success" : "neutral";
  return <RoleBadge tone={tone}>{receiptChannelLabel(channel)}</RoleBadge>;
}

export function ReceiptStatusBadge({ status }: { status: string }) {
  if (status === "void") {
    return <StatusBadge variant="destructive">VOID</StatusBadge>;
  }
  return <StatusBadge variant="success">Issued</StatusBadge>;
}
