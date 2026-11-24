"use client";

/**
 * Opens the Move gift dialog with the whole payment, fetched from the server
 * (paymentLines), so a split payment whose lines sit on different pages of
 * the contributions list is still shown in full. If the fetch fails, the
 * lines the page already has are used.
 */

import { useQuery } from "@apollo/client/react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { MoveGiftDialog } from "@/components/fund-transfers/move-gift-dialog";
import { GET_PAYMENT_LINES } from "@/lib/graphql/fund-transfers";
import type { PaymentLine } from "@/lib/fund-transfers/types";

interface ServerLine {
  departmentId: string;
  department: string;
  purposeId: string | null;
  purpose: string | null;
  amount: string;
}

export function toPaymentLines(lines: ServerLine[]): PaymentLine[] {
  return lines.map((l) => ({
    departmentId: l.departmentId,
    departmentName: l.department,
    purposeName: l.purpose,
    amount: l.amount,
  }));
}

export function MoveGiftLoader({
  contributionGroupId,
  pageLines,
  onClose,
  onMoved,
}: {
  contributionGroupId: string;
  /** Lines already on the page: used only if the server lines cannot be loaded. */
  pageLines: PaymentLine[];
  onClose: () => void;
  onMoved: () => void;
}) {
  const { data, loading, error } = useQuery<{ paymentLines: ServerLine[] }>(GET_PAYMENT_LINES, {
    variables: { contributionGroupId },
    fetchPolicy: "network-only",
  });

  if (loading) {
    return (
      <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent aria-busy="true">
          <DialogTitle>Loading the payment…</DialogTitle>
          <Skeleton className="h-24 w-full" />
        </DialogContent>
      </Dialog>
    );
  }

  const serverLines = data?.paymentLines ?? [];
  const lines = !error && serverLines.length > 0 ? toPaymentLines(serverLines) : pageLines;
  return (
    <MoveGiftDialog
      key={contributionGroupId}
      open
      onOpenChange={(open) => { if (!open) onClose(); }}
      contributionGroupId={contributionGroupId}
      lines={lines}
      onMoved={onMoved}
    />
  );
}
