/**
 * DailyTotalCard (ADR-0015 D5): the day's total for the church group, by
 * hand. Totals only, never names. Share opens wa.me; Copy puts the text on
 * the clipboard; "Post to group now" sends it through the gateway (once per
 * 10 minutes). It also says how the last automatic 11:50pm post went.
 */

"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { CalendarDays, Copy, Loader2, Send, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { whatsappTextUrl } from "@/lib/fundraising/share-links";
import {
  CAMPAIGN_DAILY_TOTAL,
  POST_DAILY_TOTAL_NOW,
  RECORD_DAILY_TOTAL_SHARE,
  type CampaignDailyTotalData,
  type CampaignDailyTotalVars,
  type GroupPost,
  type PostDailyTotalNowData,
  type RecordDailyTotalShareData,
} from "@/lib/graphql/fundraising/daily-total";
import { formatKes, formatNairobiDateTime } from "@/lib/receipts/format";

const SKIP_REASONS: Record<string, string> = {
  no_gifts: "no gifts that day",
};

/** Today's date in Nairobi as YYYY-MM-DD. */
export function nairobiToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi" }).format(now);
}

function shortDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "short", timeZone: "UTC",
  });
}

export function lastAutoPostLine(post: GroupPost | null): string {
  if (!post) return "Last daily total: none yet";
  const day = post.day ? ` for ${shortDay(post.day)}` : "";
  if (post.status === "sent") {
    return `Last daily total${day}: sent ${post.sentAt ? formatNairobiDateTime(post.sentAt) : ""}`.trim();
  }
  if (post.status === "skipped") return `Last daily total${day}: not sent (${SKIP_REASONS[post.reason] ?? post.reason})`;
  if (post.status === "failed") return `Last daily total${day}: failed (${post.reason})`;
  return `Last daily total${day}: waiting to send`;
}

type Busy = "share" | "copy" | "post" | null;

export function DailyTotalCard({ campaignId }: { campaignId: string }) {
  const today = nairobiToday();
  const [day, setDay] = useState(today);
  const [busy, setBusy] = useState<Busy>(null);
  const { data, loading, error, refetch } = useQuery<CampaignDailyTotalData, CampaignDailyTotalVars>(
    CAMPAIGN_DAILY_TOTAL,
    { variables: { campaignId, date: day }, skip: !campaignId, fetchPolicy: "network-only" },
  );
  const [recordShare] = useMutation<RecordDailyTotalShareData>(RECORD_DAILY_TOTAL_SHARE);
  const [postNow] = useMutation<PostDailyTotalNowData>(POST_DAILY_TOTAL_NOW);
  const total = data?.campaignDailyTotal;

  const record = async (done: string) => {
    try {
      const { data: result } = await recordShare({ variables: { campaignId } });
      if (result?.recordWhatsappShare.success) toast.success(done);
      else toast.error(result?.recordWhatsappShare.message ?? "Could not record the share");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not record the share");
    }
  };

  const share = async () => {
    if (!total) return;
    window.open(total.shareUrl || whatsappTextUrl(total.text), "_blank", "noopener,noreferrer");
    setBusy("share");
    await record("Share recorded");
    setBusy(null);
  };

  const copy = async () => {
    if (!total) return;
    setBusy("copy");
    try {
      await navigator.clipboard.writeText(total.text);
    } catch {
      toast.error("Could not copy. Select the text and copy it by hand.");
      setBusy(null);
      return;
    }
    await record("Daily total copied. Paste it into the church group.");
    setBusy(null);
  };

  const post = async () => {
    setBusy("post");
    try {
      const { data: result } = await postNow({ variables: { campaignId, date: day } });
      const answer = result?.postDailyTotalNow;
      if (answer?.success) toast.success(answer.message);
      else toast.error(answer?.message ?? "Could not post");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not post");
    }
    setBusy(null);
    void refetch();
  };

  return (
    <Card data-testid="daily-total-card">
      <CardHeader className="gap-3">
        <div className="space-y-1">
          <CardTitle>Daily total</CardTitle>
          <CardDescription>
            The day&apos;s total for the church group, without names. It is also posted automatically at 11:50pm on
            days with gifts.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="daily-total-date">Day</Label>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
              <Input id="daily-total-date" type="date" className="w-44" value={day} max={today}
                onChange={(e) => setDay(e.target.value || today)} />
            </div>
          </div>
          {total ? (
            <dl className="flex gap-6 text-sm">
              <div><dt className="text-xs text-muted-foreground">Given that day</dt>
                <dd className="font-semibold" data-testid="daily-total-amount">{formatKes(total.amountToday)}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Givers</dt>
                <dd className="font-semibold" data-testid="daily-total-givers">{total.giversToday}</dd></div>
            </dl>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && !data ? (
          <Skeleton className="h-40 w-full" />
        ) : error && !data ? (
          <p className="text-sm text-destructive">Could not load the daily total: {error.message}</p>
        ) : total ? (
          <>
            <pre data-testid="daily-total-preview" aria-label="Daily total text"
              className="max-h-80 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words">
              {total.text}
            </pre>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button disabled={busy !== null} onClick={() => void share()}>
                {busy === "share" ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
                Share to WhatsApp
              </Button>
              <Button variant="outline" disabled={busy !== null} onClick={() => void copy()}>
                {busy === "copy" ? <Loader2 className="size-4 animate-spin" /> : <Copy className="size-4" />}
                Copy text
              </Button>
              {total.hasGroup ? (
                <Button variant="outline" disabled={busy !== null} onClick={() => void post()}>
                  {busy === "post" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  Post to group now
                </Button>
              ) : null}
            </div>
            {total.hasGroup ? (
              <p className="text-xs text-muted-foreground" data-testid="daily-total-last-post">
                {lastAutoPostLine(total.lastAutoPost)}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                No WhatsApp group set, so nothing is posted automatically. Add the group on the campaign form.
              </p>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
