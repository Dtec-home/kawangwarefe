/**
 * FindMpesaPayment (W1, F1): a member says "I paid, here is the code".
 * Staff enter the code; if we have it, they are told where; otherwise
 * Safaricom is asked (Transaction Status Query) and the answer records the
 * payment as a Pay Bill transaction within minutes. Admin or treasurer.
 */

"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FIND_MPESA_PAYMENT, MPESA_STATUS_QUERIES } from "@/lib/graphql/payment-recovery";

const OUTCOME: Record<string, string> = {
  requested: "Asked Safaricom",
  recorded: "Found and recorded",
  already_recorded: "Already recorded",
  not_found: "Safaricom has no such payment",
  not_ours: "Paid to another business",
  failed: "Could not ask Safaricom",
};

export function isMpesaCode(value: string): boolean {
  return /^[A-Z0-9]{10}$/.test(value.trim().toUpperCase());
}

interface Lookup { transId: string; status: string; resultDesc: string; createdAt: string }
interface FindResult { success: boolean; message: string; status: string }

export function FindMpesaPayment({ onFound }: { onFound?: () => void }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [result, setResult] = useState<FindResult | null>(null);
  const { data, refetch } = useQuery<{ mpesaStatusQueries: Lookup[] }>(MPESA_STATUS_QUERIES, {
    variables: { limit: 10 }, skip: !open, fetchPolicy: "network-only",
  });
  const [findPayment, { loading }] = useMutation<{ findMpesaPayment: FindResult }>(FIND_MPESA_PAYMENT);

  const submit = async () => {
    setResult(null);
    try {
      const { data: res } = await findPayment({ variables: { code: code.trim().toUpperCase() } });
      const answer = res?.findMpesaPayment ?? null;
      setResult(answer);
      if (answer?.success) onFound?.();
      void refetch();
    } catch (e) {
      setResult({ success: false, status: "failed", message: e instanceof Error ? e.message : "Something went wrong" });
    }
  };

  const recent = data?.mpesaStatusQueries ?? [];

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) { setResult(null); setCode(""); } }}>
      <DialogTrigger asChild>
        <Button variant="outline"><Search className="h-4 w-4 mr-2" />Find payment by M-Pesa code</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Find a payment by its M-Pesa code</DialogTitle>
          <DialogDescription>
            For a member who paid but whose payment is not here. If Safaricom confirms it was paid to us,
            it appears in Pay Bill transactions within a few minutes, ready to file.
          </DialogDescription>
        </DialogHeader>
        <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (isMpesaCode(code)) void submit(); }}>
          <div className="flex-1 space-y-1">
            <Label htmlFor="mpesa-code">M-Pesa code</Label>
            <Input id="mpesa-code" className="font-mono uppercase" placeholder="UK35C0RVDD" maxLength={12}
              value={code} onChange={(e) => { setCode(e.target.value); setResult(null); }} />
          </div>
          <Button type="submit" disabled={loading || !isMpesaCode(code)}>{loading ? "Finding..." : "Find"}</Button>
        </form>
        {result && (
          <p role={result.success ? "status" : "alert"}
            className={result.success ? "text-sm rounded-md bg-muted p-3" : "text-sm rounded-md bg-destructive/10 text-destructive p-3"}>
            {result.message}
          </p>
        )}
        {recent.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Recent lookups</p>
            <ul className="divide-y rounded-md border text-sm" aria-label="Recent lookups">
              {recent.map((q) => (
                <li key={`${q.transId}-${q.createdAt}`} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span className="font-mono">{q.transId}</span>
                  <span className="text-muted-foreground text-right">{OUTCOME[q.status] ?? q.status}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
