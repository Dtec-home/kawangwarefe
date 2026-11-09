/**
 * PayerRecordOffer (MP-0): shown instead of an error when the number being
 * added has already given by Pay Bill. The payer's record is offered so the
 * new member keeps those gifts instead of becoming a second record.
 */

"use client";

import { Wallet } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export interface PayerRecord {
  memberId: string;
  payerName: string;
  giftCount: number;
  giftTotal: string;
  lastGiftAt?: string | null;
}

function wholeKes(amount: string): string {
  const value = Number.parseFloat(amount);
  return `KES ${Math.round(Number.isFinite(value) ? value : 0).toLocaleString("en-KE")}`;
}

export function PayerRecordOffer({
  record,
  phone,
  memberName,
  onUse,
  onBack,
  saving = false,
}: {
  record: PayerRecord;
  phone: string;
  memberName: string;
  onUse: () => void;
  onBack: () => void;
  saving?: boolean;
}) {
  const payments = record.giftCount === 1 ? "payment" : "payments";
  return (
    <div className="space-y-4" data-testid="payer-record-offer">
      <Alert>
        <Wallet className="h-4 w-4" />
        <AlertTitle>This number has given before</AlertTitle>
        <AlertDescription>
          <p>
            {phone} has already given {wholeKes(record.giftTotal)} in {record.giftCount} Pay Bill {payments} as{" "}
            <strong className="font-semibold">{record.payerName}</strong>.
          </p>
          <p className="mt-2">
            Use that record? {memberName} will keep those gifts, with the roles and groups you chose.
          </p>
        </AlertDescription>
      </Alert>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onBack} disabled={saving}>
          Back
        </Button>
        <Button onClick={onUse} disabled={saving}>
          {saving ? "Saving..." : "Use this record"}
        </Button>
      </div>
    </div>
  );
}
