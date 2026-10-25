/**
 * Void-request inbox (T2.6, D6).
 *
 * Treasurers and admins review requests (e.g. from recorders) to void a
 * receipt: approving voids the receipt, rejecting leaves it issued. Either
 * decision may carry a note. The backend re-checks `can_void_receipts`.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client/react";
import { Check, Inbox, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { ReceiptStatusBadge } from "@/components/receipts/receipt-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty } from "@/components/ui/empty";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, statusToVariant } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import {
  DECIDE_VOID_REQUEST,
  GET_VOID_REQUESTS,
  type DecideVoidRequestData,
  type DecideVoidRequestVars,
  type VoidRequest,
  type VoidRequestsData,
} from "@/lib/graphql/receipt-queries";
import {
  formatKes,
  formatNairobiDateTime,
  formatReceiptDate,
  receiptGiver,
  receiptHref,
} from "@/lib/receipts/format";

type Decision = { request: VoidRequest; approve: boolean };

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export function VoidRequestsInbox() {
  const [status, setStatus] = useState("pending");
  const [decision, setDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState("");

  const { data, loading, error, refetch } = useQuery<VoidRequestsData>(GET_VOID_REQUESTS, {
    variables: { status },
    fetchPolicy: "cache-and-network",
  });
  const [decide, { loading: deciding }] = useMutation<DecideVoidRequestData, DecideVoidRequestVars>(
    DECIDE_VOID_REQUEST,
    { refetchQueries: ["GetPendingVoidRequestCount", "GetReceipts"] }
  );

  const requests = data?.voidRequests ?? [];

  const closeDialog = () => {
    setDecision(null);
    setNote("");
  };

  const confirm = async () => {
    if (!decision) return;
    try {
      const { data: result } = await decide({
        variables: {
          requestId: decision.request.id,
          approve: decision.approve,
          note: note.trim() || null,
        },
      });
      const response = result?.decideVoidRequest;
      if (response?.success) {
        toast.success(
          decision.approve
            ? `Void approved — receipt ${decision.request.receipt.number} is now VOID`
            : `Void request for ${decision.request.receipt.number} rejected`
        );
        closeDialog();
        refetch();
      } else {
        toast.error(response?.message || "Could not record the decision");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not record the decision");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Requests to void a receipt. Approving voids it; rejecting leaves it issued.
        </p>
        <div className="flex items-center gap-2">
          <Label htmlFor="void-request-status" className="whitespace-nowrap">
            Show
          </Label>
          <Select name="voidRequestStatus" value={status} onValueChange={setStatus}>
            <SelectTrigger id="void-request-status" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && !data && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      )}

      {error && !data && (
        <p className="py-8 text-center text-destructive">Could not load void requests: {error.message}</p>
      )}

      {data && requests.length === 0 && (
        <Empty
          icon={Inbox}
          title={status === "pending" ? "No pending void requests" : `No ${STATUS_LABELS[status]?.toLowerCase()} requests`}
        />
      )}

      <ul className="space-y-3">
        {requests.map((request) => (
          <li key={request.id}>
            <Card>
              <CardContent className="space-y-3 pt-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <Link
                      href={receiptHref(request.receipt.number)}
                      className="font-mono font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      {request.receipt.number}
                    </Link>
                    <p className="text-sm">
                      {receiptGiver(request.receipt)} · {formatKes(request.receipt.totalAmount)} ·{" "}
                      {formatReceiptDate(request.receipt.receiptDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ReceiptStatusBadge status={request.receipt.status} />
                    <StatusBadge variant={statusToVariant(request.status)}>
                      {STATUS_LABELS[request.status] ?? request.status}
                    </StatusBadge>
                  </div>
                </div>
                <div className="rounded-md bg-muted/60 p-3 text-sm">
                  <p className="whitespace-pre-wrap">{request.reason}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Requested by {request.requestedByName || "Unknown"} · {formatNairobiDateTime(request.createdAt)}
                  </p>
                </div>
                {request.status !== "pending" && (
                  <p className="text-xs text-muted-foreground">
                    {STATUS_LABELS[request.status] ?? request.status} by {request.decidedByName || "Unknown"}
                    {request.decidedAt ? ` · ${formatNairobiDateTime(request.decidedAt)}` : ""}
                    {request.decisionNote ? ` — ${request.decisionNote}` : ""}
                  </p>
                )}
                {request.status === "pending" && (
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={`Reject void request for ${request.receipt.number}`}
                      onClick={() => setDecision({ request, approve: false })}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      aria-label={`Approve void request for ${request.receipt.number}`}
                      onClick={() => setDecision({ request, approve: true })}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      <Dialog open={decision !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision?.approve ? "Approve void" : "Reject void request"} — {decision?.request.receipt.number}
            </DialogTitle>
            <DialogDescription>
              {decision?.approve
                ? "The receipt will be marked VOID and left out of totals. This cannot be undone."
                : "The receipt stays issued. Let the requester know why."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="void-decision-note">Note (optional)</Label>
            <Textarea
              id="void-decision-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={deciding}>
              Cancel
            </Button>
            <Button variant={decision?.approve ? "destructive" : "default"} onClick={confirm} disabled={deciding}>
              {deciding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {decision?.approve ? "Approve and void" : "Reject request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
