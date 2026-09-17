/**
 * Collection sessions (T5.3, PRD §5.4 CS-3).
 *
 * The treasurer reviews each session's recorded vs counted cash, confirms the
 * cash handover for closed sessions, and sees whether each date's statement
 * is certified. Staff can view; only treasurers/admins confirm (the backend
 * enforces this too).
 */

"use client";

import { Fragment, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { AlertCircle, CheckCheck, Coins, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, type StatusVariant } from "@/components/ui/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CertificationChip, certificationFor } from "@/components/treasury/statement-certification";
import {
  CONFIRM_COLLECTION_SESSION,
  GET_COLLECTION_SESSIONS,
  GET_STATEMENT_CERTIFICATIONS,
  type CollectionSession,
  type CollectionSessionsData,
  type CollectionSessionsVars,
  type ConfirmCollectionSessionData,
  type StatementCertificationsData,
  type StatementCertificationsVars,
} from "@/lib/graphql/collection-session-queries";
import { useUserRole } from "@/lib/hooks/use-user-role";
import { formatCents, shiftWeeks, signedToCents, thisChurchWeek } from "@/lib/treasury/collection-sessions";
import { formatEntryDate } from "@/lib/treasury/entry-dates";
import { formatKes } from "@/lib/receipts/format";
import { cn } from "@/lib/utils";

const STATUS_VARIANTS: Record<string, StatusVariant> = {
  open: "warning",
  closed: "info",
  confirmed: "success",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  closed: "Closed",
  confirmed: "Confirmed",
};

function VarianceCell({ variance }: { variance: string | null }) {
  const cents = signedToCents(variance);
  if (cents === null) return <span className="text-muted-foreground">—</span>;
  if (cents === 0) return <span className="tabular-nums text-muted-foreground">KES 0.00</span>;
  // Short (negative) is red; over (positive) is amber.
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 font-semibold tabular-nums",
        cents < 0 ? "bg-destructive/12 text-destructive" : "bg-warning/15 text-warning"
      )}
      data-variance={cents < 0 ? "short" : "over"}
    >
      {cents < 0 ? "−" : "+"}KES {formatCents(Math.abs(cents))}
    </span>
  );
}

function groupByDate(sessions: CollectionSession[]): [string, CollectionSession[]][] {
  const groups = new Map<string, CollectionSession[]>();
  for (const session of sessions) {
    const list = groups.get(session.date) ?? [];
    list.push(session);
    groups.set(session.date, list);
  }
  return [...groups.entries()].sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0));
}

function CollectionSessionsContent() {
  const { canManageBooks } = useUserRole();
  const [range, setRange] = useState(() => thisChurchWeek());
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const rangeError = !range.dateFrom || !range.dateTo
    ? "Choose both dates"
    : range.dateTo < range.dateFrom
      ? "The end date must not be before the start date"
      : null;

  const { data, loading, error, refetch } = useQuery<CollectionSessionsData, CollectionSessionsVars>(
    GET_COLLECTION_SESSIONS,
    { variables: { dateFrom: range.dateFrom, dateTo: range.dateTo }, skip: !!rangeError, fetchPolicy: "cache-and-network" }
  );
  const { data: certData } = useQuery<StatementCertificationsData, StatementCertificationsVars>(
    GET_STATEMENT_CERTIFICATIONS,
    { variables: { dateFrom: range.dateFrom, dateTo: range.dateTo }, skip: !!rangeError, fetchPolicy: "cache-and-network" }
  );
  const [confirmSession] = useMutation<ConfirmCollectionSessionData>(CONFIRM_COLLECTION_SESSION);

  const sessions = data?.collectionSessions ?? [];
  const groups = groupByDate(sessions);

  const handleConfirm = async (session: CollectionSession) => {
    setConfirmingId(session.id);
    try {
      const { data: result } = await confirmSession({ variables: { id: session.id } });
      const res = result?.confirmCollectionSession;
      if (res?.success) {
        toast.success(res.message || "Handover confirmed");
        await refetch();
      } else {
        toast.error(res?.message || "Could not confirm the handover");
      }
    } catch (err) {
      toast.error((err instanceof Error && err.message) || "Could not confirm the handover");
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Collection sessions"
        description="Recorded versus counted cash for each collection, the handover to the treasurer, and whether each date's statement is certified."
      />

      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="sessions-from">From</Label>
            <Input
              id="sessions-from"
              type="date"
              value={range.dateFrom}
              onChange={(e) => setRange((r) => ({ ...r, dateFrom: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sessions-to">To</Label>
            <Input
              id="sessions-to"
              type="date"
              value={range.dateTo}
              onChange={(e) => setRange((r) => ({ ...r, dateTo: e.target.value }))}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setRange((r) => shiftWeeks(r, -1))} disabled={!!rangeError}>
              Previous week
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setRange(thisChurchWeek())}>
              This week
            </Button>
          </div>
          {rangeError && (
            <p role="alert" className="flex items-center gap-1.5 text-sm text-destructive sm:basis-full">
              <AlertCircle className="h-4 w-4" />
              {rangeError}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {rangeError ? null : loading && !data ? (
            <div className="space-y-3" data-testid="sessions-loading">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error && !data ? (
            <p role="alert" className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {error.message || "Could not load collection sessions"}
            </p>
          ) : sessions.length === 0 ? (
            <Empty
              icon={Coins}
              title="No collection sessions"
              description="No sessions were opened in this period."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table aria-label="Collection sessions">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Opened by</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Receipts</TableHead>
                    <TableHead className="text-right">Recorded</TableHead>
                    <TableHead className="text-right">Counted</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead>Variance reason</TableHead>
                    <TableHead>
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map(([date, dateSessions]) => (
                    <Fragment key={date}>
                      <TableRow className="bg-muted/50 hover:bg-muted/50" data-testid={`date-row-${date}`}>
                        <TableCell colSpan={10}>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-semibold">{formatEntryDate(date)}</span>
                            <CertificationChip
                              certification={certificationFor(certData?.statementCertifications, date)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                      {dateSessions.map((session) => (
                        <TableRow key={session.id} data-testid={`session-row-${session.id}`}>
                          <TableCell className="whitespace-nowrap text-muted-foreground">{formatEntryDate(session.date)}</TableCell>
                          <TableCell className="font-medium">{session.name}</TableCell>
                          <TableCell>{session.openedByName || "—"}</TableCell>
                          <TableCell>
                            <StatusBadge variant={STATUS_VARIANTS[session.status] ?? "neutral"}>
                              {STATUS_LABELS[session.status] ?? session.status}
                            </StatusBadge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{session.receiptCount}</TableCell>
                          <TableCell className="text-right tabular-nums whitespace-nowrap">{formatKes(session.recordedTotal)}</TableCell>
                          <TableCell className="text-right tabular-nums whitespace-nowrap">
                            {session.countedCash == null ? "—" : formatKes(session.countedCash)}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <VarianceCell variance={session.variance} />
                          </TableCell>
                          <TableCell className="min-w-40 max-w-64 text-sm text-muted-foreground break-words whitespace-normal">
                            {session.varianceReason || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {session.status === "closed" && canManageBooks ? (
                              <Button
                                size="sm"
                                onClick={() => void handleConfirm(session)}
                                disabled={confirmingId === session.id}
                                aria-label={`Confirm handover for ${session.name} on ${formatEntryDate(session.date)}`}
                              >
                                {confirmingId === session.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <CheckCheck className="h-4 w-4 mr-2" />
                                )}
                                Confirm handover
                              </Button>
                            ) : session.status === "confirmed" && session.confirmedByName ? (
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                by {session.confirmedByName}
                              </span>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CollectionSessionsPage() {
  return (
    <AdminProtectedRoute requiredAccess="staff">
      <AdminLayout>
        <CollectionSessionsContent />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
