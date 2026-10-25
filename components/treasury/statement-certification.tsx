"use client";

/**
 * Statement certification (T5.2 / T5.3, PRD §5.4, D14).
 *
 * A treasurer or admin certifies a date's Cash Statement once the cash is
 * counted: the date is then locked — no manual entries and no voids — until
 * an admin unlocks it with a reason. The backend refuses future dates,
 * already-certified dates and dates with open collection sessions.
 */

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { BadgeCheck, Loader2, LockOpen, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import {
  CERTIFY_STATEMENT,
  GET_STATEMENT_CERTIFICATIONS,
  UNLOCK_STATEMENT,
  type CertifyStatementData,
  type StatementCertification,
  type StatementCertificationsData,
  type StatementCertificationsVars,
  type UnlockStatementData,
} from "@/lib/graphql/collection-session-queries";
import { useUserRole } from "@/lib/hooks/use-user-role";
import { MIN_UNLOCK_REASON_LENGTH } from "@/lib/treasury/collection-sessions";
import { formatEntryDate } from "@/lib/treasury/entry-dates";
import { formatNairobiDateTime } from "@/lib/receipts/format";

/** The certification row for a date, if any (active or unlocked). */
export function certificationFor(
  certifications: StatementCertification[] | undefined,
  date: string
): StatementCertification | undefined {
  return certifications?.find((c) => c.date === date);
}

export function CertificationChip({ certification }: { certification: StatementCertification | undefined }) {
  if (certification?.isActive) {
    return (
      <StatusBadge variant="success" data-testid="certification-status" data-certified="true">
        <BadgeCheck className="h-3.5 w-3.5" />
        Certified by {certification.certifiedByName || "unknown"} on {formatNairobiDateTime(certification.certifiedAt)}
      </StatusBadge>
    );
  }
  return (
    <StatusBadge
      variant="neutral"
      data-testid="certification-status"
      data-certified="false"
      title={
        certification?.unlockedAt
          ? `Unlocked by ${certification.unlockedByName || "an admin"} on ${formatNairobiDateTime(certification.unlockedAt)}: ${certification.unlockReason}`
          : undefined
      }
    >
      {certification?.unlockedAt ? "Not certified (unlocked)" : "Not certified"}
    </StatusBadge>
  );
}

interface StatementCertificationControlProps {
  date: string;
  onChanged?: () => void;
}

/** Status chip plus the Certify (treasurer/admin) and Unlock (admin) actions for one date. */
export function StatementCertificationControl({ date, onChanged }: StatementCertificationControlProps) {
  const { canManageBooks, isAdmin } = useUserRole();
  const [certifyOpen, setCertifyOpen] = useState(false);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  const { data, loading, error, refetch } = useQuery<StatementCertificationsData, StatementCertificationsVars>(
    GET_STATEMENT_CERTIFICATIONS,
    { variables: { dateFrom: date, dateTo: date }, skip: !date, fetchPolicy: "cache-and-network" }
  );
  const [certify, { loading: certifying }] = useMutation<CertifyStatementData>(CERTIFY_STATEMENT);
  const [unlock, { loading: unlocking }] = useMutation<UnlockStatementData>(UNLOCK_STATEMENT);

  const certification = certificationFor(data?.statementCertifications, date);
  const certified = !!certification?.isActive;

  const afterChange = async () => {
    try {
      await refetch();
    } catch {
      /* the chip keeps its last known state */
    }
    onChanged?.();
  };

  const handleCertify = async () => {
    try {
      const { data: result } = await certify({ variables: { date } });
      const res = result?.certifyStatement;
      if (res?.success) {
        toast.success(res.message || "Statement certified");
        setCertifyOpen(false);
        await afterChange();
      } else {
        toast.error(res?.message || "Could not certify the statement");
        setCertifyOpen(false);
      }
    } catch (err) {
      toast.error((err instanceof Error && err.message) || "Could not certify the statement");
    }
  };

  const closeUnlock = (open: boolean) => {
    if (unlocking) return;
    setUnlockOpen(open);
    if (!open) {
      setReason("");
      setReasonError(null);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length < MIN_UNLOCK_REASON_LENGTH) {
      setReasonError(`Give a reason of at least ${MIN_UNLOCK_REASON_LENGTH} characters`);
      return;
    }
    setReasonError(null);
    try {
      const { data: result } = await unlock({ variables: { date, reason: trimmed } });
      const res = result?.unlockStatement;
      if (res?.success) {
        toast.success(res.message || "Statement unlocked");
        setUnlockOpen(false);
        setReason("");
        await afterChange();
      } else {
        toast.error(res?.message || "Could not unlock the statement");
      }
    } catch (err) {
      toast.error((err instanceof Error && err.message) || "Could not unlock the statement");
    }
  };

  if (!date) return null;

  return (
    <div className="flex flex-wrap items-center gap-3" data-testid="statement-certification">
      {loading && !data ? (
        <StatusBadge variant="neutral">Checking certification…</StatusBadge>
      ) : error && !data ? (
        <StatusBadge variant="neutral" data-testid="certification-status">Certification status unavailable</StatusBadge>
      ) : (
        <CertificationChip certification={certification} />
      )}

      {canManageBooks && !certified && data && (
        <Button type="button" size="sm" variant="outline" onClick={() => setCertifyOpen(true)}>
          <ShieldCheck className="h-4 w-4 mr-2" />
          Certify statement
        </Button>
      )}
      {isAdmin && certified && (
        <Button type="button" size="sm" variant="outline" onClick={() => setUnlockOpen(true)}>
          <LockOpen className="h-4 w-4 mr-2" />
          Unlock
        </Button>
      )}

      <AlertDialog open={certifyOpen} onOpenChange={(open) => !certifying && setCertifyOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Certify the statement for {formatEntryDate(date)}?</AlertDialogTitle>
            <AlertDialogDescription>
              Certifying confirms the Cash Statement for this date is correct and locks it: no more manual entries
              can be recorded and no receipts can be voided for {formatEntryDate(date)}. Only an admin can unlock it
              again. All collection sessions for the date must be closed first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={certifying}>Cancel</AlertDialogCancel>
            <Button onClick={() => void handleCertify()} disabled={certifying} aria-busy={certifying}>
              {certifying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Certify and lock
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={unlockOpen} onOpenChange={closeUnlock}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock the statement for {formatEntryDate(date)}</DialogTitle>
            <DialogDescription>
              Unlocking lets entries and voids be recorded for this date again. The reason is kept in the audit log;
              the statement must be certified again afterwards.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUnlock} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="unlock-statement-reason">Reason</Label>
              <Textarea
                id="unlock-statement-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                aria-invalid={!!reasonError}
                aria-describedby={reasonError ? "unlock-statement-reason-error" : undefined}
              />
              {reasonError && (
                <p id="unlock-statement-reason-error" className="text-sm text-destructive">
                  {reasonError}
                </p>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => closeUnlock(false)} disabled={unlocking}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={unlocking} aria-busy={unlocking}>
                {unlocking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Unlock statement
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
