/**
 * Display helpers for receipts (T1.8).
 */

import { formatEntryDate } from "@/lib/treasury/entry-dates";

/** Minimum length of a void reason (enforced by the backend too). */
export const MIN_VOID_REASON_LENGTH = 10;

export const RECEIPT_CHANNEL_LABELS: Record<string, string> = {
  manual: "Manual",
  cash: "Local Evangelism/Loose Money",
  envelope: "Envelope",
  mpesa_stk: "M-Pesa STK",
  mpesa_c2b: "M-Pesa Pay Bill",
};

export function receiptChannelLabel(channel: string): string {
  return RECEIPT_CHANNEL_LABELS[channel] ?? channel;
}

/** "KES 1,500.00" */
export function formatKes(amount: string | number): string {
  const value = typeof amount === "number" ? amount : Number.parseFloat(amount);
  const safe = Number.isFinite(value) ? value : 0;
  return `KES ${safe.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "Sat, 29 Aug 2026" for a receipt's ISO date. */
export function formatReceiptDate(isoDate: string): string {
  return formatEntryDate(isoDate);
}

/** "17 Sep 2026, 14:05" in Nairobi time for an ISO datetime. */
export function formatNairobiDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Africa/Nairobi",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** The name printed on a receipt: the walk-in giver name, else the member. */
export function receiptGiver(receipt: { giverName: string | null; memberName: string | null }): string {
  return receipt.giverName || receipt.memberName || "Anonymous";
}

/** Path of the printable receipt page. */
export function receiptHref(number: string): string {
  return `/receipts/${encodeURIComponent(number)}`;
}
