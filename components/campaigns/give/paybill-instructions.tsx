/**
 * PaybillInstructions — how to give to a campaign from the M-Pesa menu, with
 * a copy button for the account reference (S1-UI-B, ticket 1.12).
 */

"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { PaymentInstructions } from "@/lib/types/fundraising";

export function PaybillInstructions({ instructions }: { instructions: PaymentInstructions }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(instructions.accountReference);
      toast.success("Account number copied");
    } catch {
      toast.error("Could not copy the account number");
    }
  };

  return (
    <div data-slot="paybill-instructions" className="space-y-3 rounded-lg border bg-muted/40 p-4">
      <p className="text-sm font-medium">Or pay from your M-Pesa menu</p>
      <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">Pay Bill</dt>
        <dd data-testid="paybill-number" className="font-mono font-semibold tabular-nums">
          {instructions.paybillNumber}
        </dd>
        <dt className="text-muted-foreground">Account</dt>
        <dd className="flex items-center gap-2">
          <span data-testid="paybill-account" className="font-mono font-semibold">
            {instructions.accountReference}
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={copy} aria-label="Copy account number">
            <Copy className="size-4" />
          </Button>
        </dd>
      </dl>
      {instructions.text ? <p className="text-xs text-muted-foreground">{instructions.text}</p> : null}
    </div>
  );
}
