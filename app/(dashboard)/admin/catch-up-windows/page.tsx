/**
 * Catch-up windows (T2.8 / RR-7 / D13)
 *
 * Nobody can backdate entries. An admin may open a time-limited window for
 * one past date (e.g. after an internet outage) so recorders can enter gifts
 * for that day. Opening and closing are audit-logged server-side.
 *
 * Gated as staff in the UI: `currentUserRole` does not expose an admin-only
 * flag, so treasurers/pastors can see the page but the backend refuses their
 * open/close requests ("Only admins can manage catch-up windows").
 */

"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { CalendarClock, Loader2, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { useActiveEntryUnlocks } from "@/lib/hooks/use-active-entry-unlocks";
import {
  CLOSE_ENTRY_DATE_UNLOCK,
  OPEN_ENTRY_DATE_UNLOCK,
  type CloseEntryDateUnlockData,
  type CloseEntryDateUnlockVars,
  type OpenEntryDateUnlockData,
  type OpenEntryDateUnlockVars,
} from "@/lib/graphql/treasury-mutations";
import { formatEntryDate, formatExpiresIn, nairobiToday, previousDay } from "@/lib/treasury/entry-dates";
import {
  DEFAULT_HOURS,
  MAX_HOURS,
  MIN_HOURS,
  validateCatchUpWindow,
  type CatchUpWindowErrors,
} from "@/lib/treasury/catch-up-windows";

function CatchUpWindowsContent() {
  const { unlocks, loading, refetch } = useActiveEntryUnlocks({ pollInterval: 60_000 });
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [hours, setHours] = useState(String(DEFAULT_HOURS));
  const [errors, setErrors] = useState<CatchUpWindowErrors>({});
  const [closingId, setClosingId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  // Keep "expires in" labels fresh
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const [openUnlock, { loading: opening }] = useMutation<OpenEntryDateUnlockData, OpenEntryDateUnlockVars>(
    OPEN_ENTRY_DATE_UNLOCK
  );
  const [closeUnlock] = useMutation<CloseEntryDateUnlockData, CloseEntryDateUnlockVars>(
    CLOSE_ENTRY_DATE_UNLOCK
  );

  const maxDate = previousDay(nairobiToday());

  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateCatchUpWindow({ date, reason, hours });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    try {
      const { data } = await openUnlock({
        variables: { date, reason: reason.trim(), hours: Number(hours) },
      });
      const res = data?.openEntryDateUnlock;
      if (res?.success) {
        toast.success(res.message || "Catch-up window opened");
        setDate("");
        setReason("");
        setHours(String(DEFAULT_HOURS));
        await refetch();
      } else {
        toast.error(res?.message || "Could not open the catch-up window");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not open the catch-up window");
    }
  };

  const handleClose = async (id: string) => {
    setClosingId(id);
    try {
      const { data } = await closeUnlock({ variables: { id } });
      const res = data?.closeEntryDateUnlock;
      if (res?.success) {
        toast.success(res.message || "Catch-up window closed");
        await refetch();
      } else {
        toast.error(res?.message || "Could not close the catch-up window");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not close the catch-up window");
    } finally {
      setClosingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catch-up windows"
        description="Entries can only be recorded for today. Open a catch-up window to let recorders enter gifts for a past date (e.g. after an internet outage)."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Unlock className="h-4 w-4 text-primary" />
              Open a window
            </CardTitle>
            <CardDescription>Only admins can open or close windows. Every change is audit-logged.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOpen} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="unlock-date">Date to open</Label>
                <Input
                  id="unlock-date"
                  type="date"
                  max={maxDate}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  aria-invalid={!!errors.date}
                  aria-describedby={errors.date ? "unlock-date-error" : undefined}
                />
                {errors.date && (
                  <p id="unlock-date-error" className="text-sm text-destructive">{errors.date}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="unlock-reason">Reason</Label>
                <Textarea
                  id="unlock-reason"
                  rows={3}
                  placeholder="Internet outage during service"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  aria-invalid={!!errors.reason}
                  aria-describedby={errors.reason ? "unlock-reason-error" : undefined}
                />
                {errors.reason && (
                  <p id="unlock-reason-error" className="text-sm text-destructive">{errors.reason}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="unlock-hours">Duration (hours)</Label>
                <Input
                  id="unlock-hours"
                  type="number"
                  inputMode="numeric"
                  min={MIN_HOURS}
                  max={MAX_HOURS}
                  step={1}
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  aria-invalid={!!errors.hours}
                  aria-describedby={errors.hours ? "unlock-hours-error" : "unlock-hours-help"}
                />
                {errors.hours ? (
                  <p id="unlock-hours-error" className="text-sm text-destructive">{errors.hours}</p>
                ) : (
                  <p id="unlock-hours-help" className="text-xs text-muted-foreground">
                    Default {DEFAULT_HOURS} hours, maximum {MAX_HOURS}.
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={opening}>
                {opening ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Unlock className="mr-2 h-4 w-4" />}
                Open catch-up window
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CalendarClock className="h-4 w-4 text-primary" />
              Open windows
            </CardTitle>
            <CardDescription>Recorders can enter gifts for these dates until the window expires or is closed.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading && unlocks.length === 0 ? (
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : unlocks.length === 0 ? (
              <Empty
                icon={Lock}
                title="No open catch-up windows"
                description="Recording is limited to today."
              />
            ) : (
              <ul className="divide-y divide-border" aria-label="Open catch-up windows">
                {unlocks.map((u) => (
                  <li key={u.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{formatEntryDate(u.unlockDate)}</p>
                        <StatusBadge variant="warning">{formatExpiresIn(u.expiresAt, now)}</StatusBadge>
                      </div>
                      <p className="text-sm text-muted-foreground break-words">{u.reason}</p>
                      {u.openedByName && (
                        <p className="text-xs text-muted-foreground">Opened by {u.openedByName}</p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleClose(u.id)}
                      disabled={closingId === u.id}
                      aria-label={`Close window for ${formatEntryDate(u.unlockDate)}`}
                    >
                      {closingId === u.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                      Close
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function CatchUpWindowsPage() {
  return (
    <AdminProtectedRoute requiredAccess="staff">
      <AdminLayout>
        <CatchUpWindowsContent />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
