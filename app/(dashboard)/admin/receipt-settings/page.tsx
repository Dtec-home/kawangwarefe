/**
 * Receipt Book Settings (Ticket 9)
 *
 * Admin section to configure the global auto-incrementing manual receipt
 * sequence: starting number, prefix and zero-padding. The manual entry form
 * uses the next number in this sequence whenever staff leave the receipt
 * number blank.
 */

"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  GET_NEXT_RECEIPT_NUMBER,
  SET_RECEIPT_SEQUENCE,
} from "@/lib/graphql/manual-contribution-mutations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { ArrowLeft, CheckCircle, AlertCircle, Save } from "lucide-react";
import Link from "next/link";

interface ReceiptSequence {
  prefix: string;
  nextNumber: number;
  padding: number;
  nextReceiptNumber: string;
}

interface NextReceiptNumberResult {
  nextReceiptNumber: ReceiptSequence | null;
}

interface SetReceiptSequenceResult {
  setReceiptSequence: {
    success: boolean;
    message: string;
    sequence: ReceiptSequence | null;
  };
}

function ReceiptSettingsPageContent() {
  const [prefix, setPrefix] = useState("");
  const [nextNumber, setNextNumber] = useState("");
  const [padding, setPadding] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const { data, loading } = useQuery<NextReceiptNumberResult>(
    GET_NEXT_RECEIPT_NUMBER,
    { fetchPolicy: "cache-and-network" }
  );
  const current = data?.nextReceiptNumber;

  // Seed the inputs once with the current sequence values.
  const [seeded, setSeeded] = useState(false);
  useEffect(() => {
    if (current && !seeded) {
      setPrefix(current.prefix);
      setNextNumber(String(current.nextNumber));
      setPadding(String(current.padding));
      setSeeded(true);
    }
  }, [current, seeded]);

  const [setReceiptSequence] = useMutation<SetReceiptSequenceResult>(
    SET_RECEIPT_SEQUENCE,
    { refetchQueries: [{ query: GET_NEXT_RECEIPT_NUMBER }] }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const parsedNext = nextNumber.trim() === "" ? null : parseInt(nextNumber, 10);
    const parsedPadding = padding.trim() === "" ? null : parseInt(padding, 10);

    if (parsedNext !== null && (Number.isNaN(parsedNext) || parsedNext < 0)) {
      setError("Next number must be 0 or greater");
      return;
    }
    if (
      parsedPadding !== null &&
      (Number.isNaN(parsedPadding) || parsedPadding < 1 || parsedPadding > 10)
    ) {
      setError("Padding must be between 1 and 10");
      return;
    }

    setSubmitting(true);
    try {
      const { data: result } = await setReceiptSequence({
        variables: {
          nextNumber: parsedNext,
          prefix: prefix.trim() === "" ? null : prefix,
          padding: parsedPadding,
        },
      });

      if (result?.setReceiptSequence?.success) {
        setSuccess(
          result.setReceiptSequence.sequence
            ? `Saved. Next receipt number: ${result.setReceiptSequence.sequence.nextReceiptNumber}`
            : "Receipt sequence updated"
        );
      } else {
        setError(
          result?.setReceiptSequence?.message || "Failed to update receipt sequence"
        );
      }
    } catch (err: any) {
      setError(err.message || "Error updating receipt sequence");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-2">
          <Link href="/admin/contributions/manual-entry">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Receipt Book Settings</h1>
            <p className="text-muted-foreground">
              Configure the auto-incrementing manual receipt numbers
            </p>
          </div>
        </div>

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Saved</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Receipt Sequence</CardTitle>
            <CardDescription>
              When staff leave the receipt number blank on a manual entry, the
              next number in this sequence is assigned automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {current && (
              <div className="mb-4 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                Next auto-assigned number:{" "}
                <span className="font-medium">{current.nextReceiptNumber}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prefix">Prefix</Label>
                <Input
                  id="prefix"
                  type="text"
                  placeholder="e.g. MB-"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Text shown before the number, e.g. &quot;MB-&quot;.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="next-number">Next number</Label>
                <Input
                  id="next-number"
                  type="number"
                  min="0"
                  placeholder="2000"
                  value={nextNumber}
                  onChange={(e) => setNextNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The next receipt will use this number, then increment.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="padding">Padding (digits)</Label>
                <Input
                  id="padding"
                  type="number"
                  min="1"
                  max="10"
                  placeholder="4"
                  value={padding}
                  onChange={(e) => setPadding(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Zero-pads the number to this many digits, e.g. 4 &rarr; 2000.
                </p>
              </div>

              <Button type="submit" disabled={submitting || loading}>
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default function ReceiptSettingsPage() {
  return (
    <AdminProtectedRoute requiredAccess="staff">
      <ReceiptSettingsPageContent />
    </AdminProtectedRoute>
  );
}
