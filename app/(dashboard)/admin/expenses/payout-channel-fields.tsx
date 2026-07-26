/**
 * Payout channel + conditional beneficiary fields for KCB Buni disbursement.
 * Shared between the request and edit expense dialogs so the two forms can't
 * drift apart. Split out of page.tsx because Next.js's App Router forbids a
 * page.tsx file from having any named export beyond its reserved set
 * (default, metadata, generateStaticParams, etc.) — the route type-checker
 * rejects extra exports, so anything meant to be independently importable
 * (e.g. for component tests) has to live in a sibling file.
 */

"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** Electronic payout channel via KCB Buni. "manual" = no electronic payout,
 * recorded via the existing payment-method field only — mapped to an empty
 * string at the GraphQL boundary (Radix Select forbids an empty item value,
 * since "" is reserved to mean "clear the selection"). */
export const PAYOUT_CHANNELS = [
  { value: "manual", label: "Manual (record only, no electronic payout)" },
  { value: "bank", label: "Bank transfer" },
  { value: "mobile_money", label: "Mobile money" },
];

/** 254XXXXXXXXX format, matching the phone format used elsewhere in the app. */
export function isValidKenyanPhone(phone: string): boolean {
  return /^254\d{9}$/.test(phone.trim());
}

export function PayoutChannelFields({
  idPrefix,
  payoutChannel,
  setPayoutChannel,
  beneficiaryAccountNumber,
  setBeneficiaryAccountNumber,
  beneficiaryPhoneNumber,
  setBeneficiaryPhoneNumber,
  beneficiaryBankCode,
  setBeneficiaryBankCode,
}: {
  idPrefix: string;
  payoutChannel: string;
  setPayoutChannel: (v: string) => void;
  beneficiaryAccountNumber: string;
  setBeneficiaryAccountNumber: (v: string) => void;
  beneficiaryPhoneNumber: string;
  setBeneficiaryPhoneNumber: (v: string) => void;
  beneficiaryBankCode: string;
  setBeneficiaryBankCode: (v: string) => void;
}) {
  return (
    <div className="space-y-4 rounded-md border border-border p-3">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-payout-channel`}>Payout channel</Label>
        <Select value={payoutChannel} onValueChange={setPayoutChannel}>
          <SelectTrigger id={`${idPrefix}-payout-channel`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYOUT_CHANNELS.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Bank transfer or mobile money enables paying this out electronically
          via KCB once approved. Manual means you&apos;ll record the payment
          yourself (cash/cheque) after paying it outside the app.
        </p>
      </div>

      {payoutChannel === "bank" && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-beneficiary-account`}>Beneficiary account number *</Label>
            <Input
              id={`${idPrefix}-beneficiary-account`}
              placeholder="e.g. 1234567890"
              value={beneficiaryAccountNumber}
              onChange={(e) => setBeneficiaryAccountNumber(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-beneficiary-bank-code`}>Bank code (leave blank if KCB)</Label>
            <Input
              id={`${idPrefix}-beneficiary-bank-code`}
              placeholder="e.g. 01"
              value={beneficiaryBankCode}
              onChange={(e) => setBeneficiaryBankCode(e.target.value)}
            />
          </div>
        </div>
      )}

      {payoutChannel === "mobile_money" && (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-beneficiary-phone`}>Beneficiary phone number *</Label>
          <Input
            id={`${idPrefix}-beneficiary-phone`}
            placeholder="254XXXXXXXXX"
            value={beneficiaryPhoneNumber}
            onChange={(e) => setBeneficiaryPhoneNumber(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
