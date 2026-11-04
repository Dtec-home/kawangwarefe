/**
 * AddPhoneForm (MP-2, P2/P3).
 *
 * mode "otp":   the member's own number — send a code to it, then confirm.
 * mode "admin": an admin or pastor adds it directly (audited server-side).
 * A number owned by someone else shows who (staff only) and a merge link.
 */

"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PhoneResult } from "./types";

type Props =
  | {
      mode: "otp";
      onRequest: (phone: string, label: string) => Promise<PhoneResult>;
      onConfirm: (phone: string, code: string, label: string) => Promise<PhoneResult>;
      onAdded: () => void;
      memberId?: string;
    }
  | {
      mode: "admin";
      onAdminAdd: (phone: string, label: string) => Promise<PhoneResult>;
      onAdded: () => void;
      memberId?: string;
    };

const MERGEABLE = new Set(["PHONE_TAKEN", "PAYER_RECORD_EXISTS"]);

export function AddPhoneForm(props: Props) {
  const [phone, setPhone] = useState("");
  const [label, setLabel] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refusal, setRefusal] = useState<PhoneResult | null>(null);

  const reset = () => {
    setPhone("");
    setLabel("");
    setCode("");
    setCodeSent(false);
    setRefusal(null);
  };

  const run = async (call: () => Promise<PhoneResult>, onSuccess: () => void) => {
    setBusy(true);
    setRefusal(null);
    try {
      const result = await call();
      if (result.success) onSuccess();
      else setRefusal(result);
    } catch (error) {
      setRefusal({ success: false, message: error instanceof Error ? error.message : "Something went wrong" });
    } finally {
      setBusy(false);
    }
  };

  const finish = () => {
    reset();
    props.onAdded();
  };

  const submit = () => {
    if (props.mode === "admin") return run(() => props.onAdminAdd(phone, label), finish);
    if (!codeSent) return run(() => props.onRequest(phone, label), () => setCodeSent(true));
    return run(() => props.onConfirm(phone, code, label), finish);
  };

  const mergeHref =
    refusal && MERGEABLE.has(refusal.code ?? "") && refusal.conflictMemberId && props.memberId
      ? `/admin/members/merge?survivor=${props.memberId}&duplicate=${refusal.conflictMemberId}`
      : null;

  const action = props.mode === "admin" ? "Add number" : codeSent ? "Confirm" : "Send code";

  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
      {refusal && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p>{refusal.message}</p>
            {mergeHref && (
              <Link href={mergeHref} className="mt-1 inline-block font-medium underline">
                Merge with {refusal.conflictMemberName}
              </Link>
            )}
          </AlertDescription>
        </Alert>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="new-phone">New number</Label>
          <Input id="new-phone" className="font-mono" placeholder="0712345678" value={phone}
            disabled={codeSent} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="new-phone-label">Label (optional)</Label>
          <Input id="new-phone-label" placeholder="Airtel, Old line…" maxLength={30} value={label}
            disabled={codeSent} onChange={(e) => setLabel(e.target.value)} />
        </div>
      </div>
      {codeSent && (
        <div className="space-y-1">
          <Label htmlFor="new-phone-code">Code sent to {phone}</Label>
          <Input id="new-phone-code" inputMode="numeric" maxLength={6} className="font-mono tracking-widest"
            value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
      )}
      <div className="flex justify-end gap-2">
        {codeSent && (
          <Button type="button" variant="outline" onClick={reset} disabled={busy}>
            Use another number
          </Button>
        )}
        <Button type="submit" disabled={busy || !phone || (codeSent && code.length < 6)}>
          {busy ? "Please wait..." : action}
        </Button>
      </div>
    </form>
  );
}
