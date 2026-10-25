/**
 * Guest pledge, step 2: the 6-digit SMS code (S3-UI-E, ticket 3.9).
 * "Send a new code" starts the pledge again, so the server's rate limit applies.
 */

"use client";

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const CODE_LENGTH = 6;

interface GuestPledgeCodeStepProps {
  /** e.g. "+254 712 345 678" */
  phoneLabel: string;
  /** The server's message after sending the code, if any. */
  notice: string | null;
  error: string | null;
  confirming: boolean;
  resending: boolean;
  onConfirm: (code: string) => void;
  onResend: () => void;
  onChangeDetails: () => void;
}

export function GuestPledgeCodeStep({
  phoneLabel,
  notice,
  error,
  confirming,
  resending,
  onConfirm,
  onResend,
  onChangeDetails,
}: GuestPledgeCodeStepProps) {
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const busy = confirming || resending;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (code.length !== CODE_LENGTH) {
      setLocalError(`Enter the ${CODE_LENGTH}-digit code`);
      return;
    }
    setLocalError(null);
    onConfirm(code);
  };

  const shown = localError ?? error;

  return (
    <form onSubmit={submit} className="space-y-4" noValidate aria-label="Confirm your pledge">
      <p className="text-sm text-muted-foreground" role="status">
        {notice || `We sent a ${CODE_LENGTH}-digit code to ${phoneLabel}.`}
      </p>
      <div className="space-y-2">
        <Label htmlFor="guest-pledge-code">{CODE_LENGTH}-digit code</Label>
        <Input
          id="guest-pledge-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={CODE_LENGTH}
          placeholder="123456"
          className="text-center text-lg tracking-[0.5em] tabular-nums"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
          aria-invalid={shown ? true : undefined}
        />
      </div>
      {shown ? (
        <Alert variant="destructive">
          <AlertDescription>{shown}</AlertDescription>
        </Alert>
      ) : null}
      <Button type="submit" className="w-full" disabled={busy}>
        {confirming ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
        Confirm pledge
      </Button>
      <div className="flex flex-wrap justify-between gap-2">
        <Button type="button" variant="link" size="sm" className="px-0" onClick={onChangeDetails} disabled={busy}>
          Change details
        </Button>
        <Button type="button" variant="link" size="sm" className="px-0" onClick={onResend} disabled={busy}>
          {resending ? <Loader2 className="size-4 animate-spin" /> : null}
          Send a new code
        </Button>
      </div>
    </form>
  );
}
