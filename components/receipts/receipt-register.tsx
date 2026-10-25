/**
 * Receipt register table and filters (T1.8, RC-6, D6).
 *
 * Staff see every receipt, filtered by date (default: today in Nairobi),
 * channel and status, and searched by number, name or M-Pesa code. Each row
 * opens the printable receipt. Treasurers and admins (`canVoidReceipts`) may
 * void a receipt with a reason.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import { Ban, ChevronLeft, ChevronRight, ReceiptText, Search } from "lucide-react";
import { ReceiptChannelBadge, ReceiptStatusBadge } from "@/components/receipts/receipt-badges";
import { VoidReceiptDialog } from "@/components/receipts/void-receipt-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GET_RECEIPTS,
  type Receipt,
  type ReceiptsData,
  type ReceiptsVars,
} from "@/lib/graphql/receipt-queries";
import { useUserRole } from "@/lib/hooks/use-user-role";
import {
  RECEIPT_CHANNEL_LABELS,
  formatKes,
  formatReceiptDate,
  receiptGiver,
  receiptHref,
} from "@/lib/receipts/format";
import { nairobiToday } from "@/lib/treasury/entry-dates";

export const RECEIPTS_PAGE_SIZE = 50;
const ALL = "all";

export function ReceiptRegister() {
  const router = useRouter();
  const { canVoidReceipts } = useUserRole();
  const [today] = useState(() => nairobiToday());
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [channel, setChannel] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [voidTarget, setVoidTarget] = useState<Receipt | null>(null);

  const resetPage = () => setPage(0);

  const variables: ReceiptsVars = {
    filter: {
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
      channel: channel === ALL ? null : channel,
      status: status === ALL ? null : status,
      search: search || null,
    },
    limit: RECEIPTS_PAGE_SIZE,
    offset: page * RECEIPTS_PAGE_SIZE,
  };

  const { data, loading, error, refetch } = useQuery<ReceiptsData, ReceiptsVars>(GET_RECEIPTS, {
    variables,
    fetchPolicy: "cache-and-network",
  });

  const receipts = data?.receipts.items ?? [];
  const totalCount = data?.receipts.totalCount ?? 0;
  const firstShown = totalCount === 0 ? 0 : page * RECEIPTS_PAGE_SIZE + 1;
  const lastShown = Math.min(totalCount, (page + 1) * RECEIPTS_PAGE_SIZE);
  const hasNext = lastShown < totalCount;

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    resetPage();
  };

  const clearFilters = () => {
    setDateFrom(today);
    setDateTo(today);
    setChannel(ALL);
    setStatus(ALL);
    setSearchInput("");
    setSearch("");
    resetPage();
  };

  const open = (receipt: Receipt) => router.push(receiptHref(receipt.number));

  const voidButton = (receipt: Receipt) =>
    canVoidReceipts && receipt.status !== "void" ? (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-destructive hover:text-destructive"
        aria-label={`Void receipt ${receipt.number}`}
        onClick={(e) => {
          e.stopPropagation();
          setVoidTarget(receipt);
        }}
      >
        <Ban className="h-4 w-4" />
      </Button>
    ) : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <form onSubmit={applySearch} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <Label htmlFor="receipt-search">Search</Label>
              <Input
                id="receipt-search"
                type="search"
                value={searchInput}
                placeholder="Receipt number, name or M-Pesa code"
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Search by number, name or M-Pesa code</p>
            </div>
            <Button type="submit" variant="outline" className="sm:mb-5">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="receipt-date-from">From</Label>
              <Input
                id="receipt-date-from"
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  resetPage();
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="receipt-date-to">To</Label>
              <Input
                id="receipt-date-to"
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  resetPage();
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="receipt-channel">Channel</Label>
              <Select
                name="channel"
                value={channel}
                onValueChange={(v) => {
                  setChannel(v);
                  resetPage();
                }}
              >
                <SelectTrigger id="receipt-channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All channels</SelectItem>
                  {Object.entries(RECEIPT_CHANNEL_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="receipt-status">Status</Label>
              <Select
                name="status"
                value={status}
                onValueChange={(v) => {
                  setStatus(v);
                  resetPage();
                }}
              >
                <SelectTrigger id="receipt-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All statuses</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="void">Void</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Reset filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading && !data && (
            <div className="space-y-2" data-testid="receipts-loading">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}

          {error && !data && (
            <p className="py-8 text-center text-destructive">Could not load receipts: {error.message}</p>
          )}

          {data && receipts.length === 0 && (
            <Empty
              icon={ReceiptText}
              title="No receipts found"
              description="Try another date range, or clear the search and filters."
            />
          )}

          {receipts.length > 0 && (
            <>
              {/* Mobile cards */}
              <ul className="space-y-2 md:hidden">
                {receipts.map((receipt) => (
                  <li
                    key={receipt.id}
                    className="rounded-lg border p-3 cursor-pointer hover:bg-muted/60"
                    onClick={() => open(receipt)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-semibold">{receipt.number}</span>
                      <span className="font-semibold">{formatKes(receipt.totalAmount)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{receiptGiver(receipt)}</span>
                      <ReceiptStatusBadge status={receipt.status} />
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>{formatReceiptDate(receipt.receiptDate)}</span>
                      <div className="flex items-center gap-1">
                        <ReceiptChannelBadge channel={receipt.channel} />
                        {voidButton(receipt)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-3 font-medium">Number</th>
                      <th className="p-3 font-medium">Date</th>
                      <th className="p-3 font-medium">Giver</th>
                      <th className="p-3 font-medium">Channel</th>
                      <th className="p-3 font-medium text-right">Total</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium">Issued by</th>
                      {canVoidReceipts && <th className="p-3 font-medium sr-only">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map((receipt) => (
                      <tr
                        key={receipt.id}
                        className={`border-b cursor-pointer hover:bg-muted/60 ${
                          receipt.status === "void" ? "text-muted-foreground" : ""
                        }`}
                        onClick={() => open(receipt)}
                      >
                        <td className="p-3 font-mono font-medium whitespace-nowrap">{receipt.number}</td>
                        <td className="p-3 whitespace-nowrap">{formatReceiptDate(receipt.receiptDate)}</td>
                        <td className="p-3">{receiptGiver(receipt)}</td>
                        <td className="p-3">
                          <ReceiptChannelBadge channel={receipt.channel} />
                        </td>
                        <td
                          className={`p-3 text-right font-semibold whitespace-nowrap ${
                            receipt.status === "void" ? "line-through" : ""
                          }`}
                        >
                          {formatKes(receipt.totalAmount)}
                        </td>
                        <td className="p-3">
                          <ReceiptStatusBadge status={receipt.status} />
                        </td>
                        <td className="p-3">{receipt.issuedByName || "System"}</td>
                        {canVoidReceipts && <td className="p-3 text-right">{voidButton(receipt)}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {data && totalCount > 0 && (
            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {firstShown}–{lastShown} of {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => setPage((p) => p + 1)}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <VoidReceiptDialog
        receipt={voidTarget}
        open={voidTarget !== null}
        onOpenChange={(next) => {
          if (!next) setVoidTarget(null);
        }}
        onVoided={() => refetch()}
      />
    </div>
  );
}
