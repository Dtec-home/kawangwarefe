"use client";

/**
 * Admin → Fund transfers (FT-2; US-16, US-17).
 *
 * Lists transfers with status chips and a department filter. Requesting is for
 * treasurers/admins (any fund) and department leaders (out of their own
 * departments). Approve/Reject/Cancel follow the server's `canApprove` /
 * `canCancel` (four eyes: never on your own request), like expenses.
 */

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { ArrowLeftRight, ArrowRight, CheckCircle, Plus, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, statusToVariant } from "@/components/ui/status-badge";
import { DepartmentSelect, type DepartmentOption } from "@/components/fund-transfers/fund-selects";
import { NewTransferDialog } from "@/components/fund-transfers/new-transfer-dialog";
import { RejectTransferDialog } from "@/components/fund-transfers/reject-transfer-dialog";
import {
  APPROVE_FUND_TRANSFER,
  CANCEL_FUND_TRANSFER,
  GET_FUND_TRANSFERS,
  REJECT_FUND_TRANSFER,
} from "@/lib/graphql/fund-transfers";
import { GET_CONTRIBUTION_CATEGORIES } from "@/lib/graphql/queries";
import {
  TRANSFER_STATUS_FILTERS,
  TRANSFER_STATUS_LABELS,
  fundLabel,
  isFundTransferError,
  transferErrorMessage,
} from "@/lib/fund-transfers/logic";
import type { FundTransfer, FundTransferResult } from "@/lib/fund-transfers/types";
import { useUserRole } from "@/lib/hooks/use-user-role";
import { formatKes } from "@/lib/receipts/format";
import { formatEntryDate } from "@/lib/treasury/entry-dates";

interface CategoriesData {
  contributionCategories: DepartmentOption[];
}

const statusVariant = (status: string) => (status === "requested" ? "warning" : statusToVariant(status));

function decisionText(t: FundTransfer): string | null {
  if (t.status === "requested") return "Waiting for another treasurer or admin";
  if (t.status === "cancelled") return "Cancelled by the requester";
  if (!t.decidedBy) return null;
  const verb = t.status === "approved" ? "Approved" : "Rejected";
  return `${verb} by ${t.decidedBy}${t.decisionNote ? ` — “${t.decisionNote}”` : ""}`;
}

export function FundTransfersView() {
  const { isAdmin, isTreasurer, ledDepartmentIds } = useUserRole();
  const isApprover = isAdmin || isTreasurer;
  const canRequest = isApprover || ledDepartmentIds.length > 0;

  const [status, setStatus] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [showNew, setShowNew] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<FundTransfer | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: categoriesData } = useQuery<CategoriesData>(GET_CONTRIBUTION_CATEGORIES);
  const departments = categoriesData?.contributionCategories ?? [];
  const fromOptions = isApprover ? departments : departments.filter((d) => ledDepartmentIds.includes(d.id));

  const { data, loading, error, refetch } = useQuery(GET_FUND_TRANSFERS, {
    variables: { status: status || null, departmentId: departmentId || null },
    fetchPolicy: "cache-and-network",
  });
  const transfers = data?.fundTransfers ?? [];

  const [approve] = useMutation(APPROVE_FUND_TRANSFER);
  const [reject] = useMutation(REJECT_FUND_TRANSFER);
  const [cancel] = useMutation(CANCEL_FUND_TRANSFER);

  const run = async (
    transfer: FundTransfer,
    action: () => Promise<FundTransferResult | undefined>,
    success: string,
  ): Promise<boolean> => {
    setBusyId(transfer.id);
    try {
      const result = await action();
      if (!result || isFundTransferError(result)) {
        toast.error(result ? transferErrorMessage(result.code, result.message) : "Something went wrong.");
        return false;
      }
      toast.success(success);
      void refetch();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const onApprove = (t: FundTransfer) =>
    run(t, async () => (await approve({ variables: { id: t.id } })).data?.approveFundTransfer, "Transfer approved");
  const onCancel = (t: FundTransfer) =>
    run(t, async () => (await cancel({ variables: { id: t.id } })).data?.cancelFundTransfer, "Transfer cancelled");
  const onReject = async (note: string) => {
    if (!rejectTarget) return;
    const ok = await run(
      rejectTarget,
      async () => (await reject({ variables: { id: rejectTarget.id, note } })).data?.rejectFundTransfer,
      "Transfer rejected",
    );
    if (ok) setRejectTarget(null);
  };

  const summary = (t: FundTransfer) =>
    `${formatKes(t.amount)} from ${fundLabel(t.fromDepartment, t.fromPurpose)} to ${fundLabel(t.toDepartment, t.toPurpose)}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fund transfers"
        description="Move money between department and purpose funds. Every transfer needs a second person to approve it."
        actions={
          canRequest ? (
            <Button onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New transfer
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardContent className="space-y-3 pt-6">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Status">
            <Button size="sm" variant={status === "" ? "default" : "outline"} aria-pressed={status === ""} onClick={() => setStatus("")}>
              All
            </Button>
            {TRANSFER_STATUS_FILTERS.map((s) => (
              <Button
                key={s.value}
                size="sm"
                variant={status === s.value ? "default" : "outline"}
                aria-pressed={status === s.value}
                onClick={() => setStatus(status === s.value ? "" : s.value)}
              >
                {s.label}
              </Button>
            ))}
          </div>
          <div className="max-w-xs">
            <DepartmentSelect
              id="ft-filter-department"
              label="Department"
              value={departmentId}
              options={departments}
              placeholder="All departments"
              onChange={setDepartmentId}
            />
          </div>
        </CardContent>
      </Card>

      {loading && transfers.length === 0 && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      )}

      {error && transfers.length === 0 && (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      )}

      {!loading && !error && transfers.length === 0 && (
        <Empty
          icon={ArrowLeftRight}
          title="No transfers"
          description={status || departmentId ? "No transfers match these filters." : "Transfers you request or approve show up here."}
        />
      )}

      {transfers.length > 0 && (
        <ul className="space-y-3">
          {transfers.map((t) => {
            const decision = decisionText(t);
            const busy = busyId === t.id;
            return (
              <li key={t.id} data-testid="fund-transfer-row">
                <Card>
                  <CardContent className="space-y-2 pt-4 pb-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-medium">
                        <span>{fundLabel(t.fromDepartment, t.fromPurpose)}</span>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-label="to" />
                        <span>{fundLabel(t.toDepartment, t.toPurpose)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold tabular-nums">{formatKes(t.amount)}</span>
                        <StatusBadge variant={statusVariant(t.status)}>{TRANSFER_STATUS_LABELS[t.status] ?? t.status}</StatusBadge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatEntryDate(t.transferDate)} · Requested by {t.requestedBy}
                    </p>
                    <p className="text-sm break-words">{t.reason}</p>
                    {decision && <p className="text-xs text-muted-foreground">{decision}</p>}
                    {(t.canApprove || t.canCancel) && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {t.canApprove && (
                          <>
                            <Button size="sm" onClick={() => onApprove(t)} disabled={busy}>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setRejectTarget(t)} disabled={busy}>
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {t.canCancel && (
                          <Button size="sm" variant="outline" onClick={() => onCancel(t)} disabled={busy}>
                            Cancel
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <NewTransferDialog
        open={showNew}
        onOpenChange={setShowNew}
        fromOptions={fromOptions}
        toOptions={departments}
        onRequested={() => void refetch()}
      />
      <RejectTransferDialog
        open={rejectTarget !== null}
        summary={rejectTarget ? summary(rejectTarget) : ""}
        busy={!!rejectTarget && busyId === rejectTarget.id}
        onOpenChange={(v) => {
          if (!v) setRejectTarget(null);
        }}
        onReject={onReject}
      />
    </div>
  );
}
