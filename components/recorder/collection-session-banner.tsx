/**
 * Collection session banner on /record (T5.3, PRD CS-1/CS-2).
 *
 * No open session: start one ("Divine Service" by default). Open session:
 * its name, receipt count and recorded total, and "Close & count". A session
 * left open from a previous day is flagged so it gets counted before a new
 * one is started. Recording works with or without a session.
 */

"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { AlertTriangle, Calculator, Loader2, PlayCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { CloseSessionDialog } from "@/components/recorder/close-session-dialog";
import {
  OPEN_COLLECTION_SESSION,
  type CollectionSession,
  type OpenCollectionSessionData,
  type OpenCollectionSessionVars,
} from "@/lib/graphql/collection-session-queries";
import { DEFAULT_SESSION_NAME, isStaleSession } from "@/lib/treasury/collection-sessions";
import { formatEntryDate } from "@/lib/treasury/entry-dates";
import { formatKes } from "@/lib/receipts/format";
import { cn } from "@/lib/utils";

interface CollectionSessionBannerProps {
  session: CollectionSession | null | undefined;
  loading: boolean;
  /** The session query failed: hide the banner, recording still works */
  unavailable?: boolean;
  /** Refetch the open session (after open/close) */
  onChanged: () => void;
}

export function CollectionSessionBanner({ session, loading, unavailable, onChanged }: CollectionSessionBannerProps) {
  const [name, setName] = useState(DEFAULT_SESSION_NAME);
  const [closeOpen, setCloseOpen] = useState(false);
  const [openSession, { loading: opening }] = useMutation<OpenCollectionSessionData, OpenCollectionSessionVars>(
    OPEN_COLLECTION_SESSION
  );

  if (session === undefined && loading) {
    return <Skeleton className="h-24 w-full rounded-xl" data-testid="session-banner-loading" />;
  }
  if (unavailable && !session) return null;

  const start = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Give the session a name");
      return;
    }
    try {
      const { data } = await openSession({ variables: { name: trimmed } });
      const result = data?.openCollectionSession;
      if (result?.success) {
        toast.success(result.message || "Collection session started");
        onChanged();
      } else {
        toast.error(result?.message || "Could not start the session");
      }
    } catch (err) {
      toast.error((err instanceof Error && err.message) || "Could not start the session");
    }
  };

  if (!session) {
    return (
      <Card data-testid="session-banner" data-state="none">
        <CardContent>
          <form onSubmit={start} className="space-y-3" aria-label="Start collection session">
            <div className="space-y-1">
              <h2 className="text-base font-semibold">No collection session open</h2>
              <p className="text-sm text-muted-foreground">
                Start a session so the cash you record can be counted and handed over together.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="session-name">Session name</Label>
                <Input
                  id="session-name"
                  value={name}
                  maxLength={100}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11"
                />
              </div>
              <Button type="submit" size="mobile" disabled={opening} aria-busy={opening}>
                {opening ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-2" />}
                Start collection session
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  const stale = isStaleSession(session);

  return (
    <>
      <Card
        data-testid="session-banner"
        data-state={stale ? "stale" : "open"}
        className={cn(stale && "border-warning/50 bg-warning/5")}
      >
        <CardContent className="space-y-3">
          {stale && (
            <div role="alert" className="flex gap-2 text-sm" data-testid="stale-session-warning">
              <AlertTriangle className="h-4 w-4 shrink-0 text-warning mt-0.5" />
              <p>
                This session from <span className="font-medium">{formatEntryDate(session.date)}</span> is still open.
                Close &amp; count it before starting today&apos;s session. Gifts recorded today are not added to it.
              </p>
            </div>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-0.5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {stale ? "Open session" : "Session in progress"}
              </p>
              <p className="truncate text-base font-semibold" data-testid="session-name">
                {session.name}
                {stale ? null : <span className="font-normal text-muted-foreground"> · {formatEntryDate(session.date)}</span>}
              </p>
              <p className="text-sm tabular-nums" data-testid="session-totals">
                {session.receiptCount} {session.receiptCount === 1 ? "receipt" : "receipts"} ·{" "}
                <span className="font-semibold">{formatKes(session.recordedTotal)}</span> recorded
              </p>
            </div>
            <Button
              size="mobile"
              variant={stale ? "default" : "outline"}
              onClick={() => setCloseOpen(true)}
              className="shrink-0"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Close &amp; count
            </Button>
          </div>
        </CardContent>
      </Card>
      <CloseSessionDialog session={session} open={closeOpen} onOpenChange={setCloseOpen} onClosed={onChanged} />
    </>
  );
}
