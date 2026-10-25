/**
 * WhatsAppShareTab: the "Share list" tab of /admin/campaigns/[id]
 * (Fundraising S2, lane S2-UI-D, ticket 2.13; decision 7).
 *
 * Staff share the campaign's contributor list (every donor's name and total,
 * no opt-out) to the church WhatsApp group. WhatsApp cannot be posted to by
 * API, so "Share list to WhatsApp" opens wa.me with the text pre-filled and the
 * person picks the group. Every share (or copy) is recorded by the backend,
 * which writes the WhatsAppListShare row and the audit entry.
 */

"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Copy, Loader2, RefreshCw, Share2, ShieldAlert, TriangleAlert, Users } from "lucide-react";
import { toast } from "sonner";

import type { CampaignTabProps } from "@/components/campaigns/admin/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { whatsappTextUrl } from "@/lib/fundraising/share-links";
import {
  GET_WHATSAPP_CONTRIBUTOR_LIST,
  RECORD_WHATSAPP_SHARE,
  type RecordWhatsappShareData,
  type RecordWhatsappShareVars,
  type WhatsappContributorListData,
  type WhatsappContributorListVars,
} from "@/lib/graphql/fundraising/whatsapp";
import { formatKes, formatNairobiDateTime } from "@/lib/receipts/format";
import type { WhatsAppContributorList } from "@/lib/types/fundraising";

export const PRIVACY_NOTE = "This list names every donor and their total. Share it only to the church group.";

/**
 * Pre-filled wa.me links much longer than this are cut short or refused by
 * some browsers and WhatsApp clients; past it, staff are told to copy instead.
 */
export const SAFE_SHARE_URL_LENGTH = 2000;

const RECORD_FAILED = "Could not record the share";

/** The link to open: the server's wa.me link, else one built from the text. */
export function shareLink(list: Pick<WhatsAppContributorList, "shareUrl" | "text">): string {
  return list.shareUrl || whatsappTextUrl(list.text);
}

export function mayBeTruncated(list: Pick<WhatsAppContributorList, "shareUrl" | "text">): boolean {
  return shareLink(list).length > SAFE_SHARE_URL_LENGTH;
}

export function contributorsLabel(count: number): string {
  return `${count} ${count === 1 ? "contributor" : "contributors"}`;
}

type Busy = "share" | "copy" | null;

function ShareSkeleton() {
  return (
    <div className="space-y-4" data-testid="whatsapp-loading">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function Figure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold">{children}</dd>
    </div>
  );
}

export const WhatsAppShareTab: React.FC<CampaignTabProps> = ({ campaignId }) => {
  const [busy, setBusy] = useState<Busy>(null);
  const { data, loading, error, refetch } = useQuery<WhatsappContributorListData, WhatsappContributorListVars>(
    GET_WHATSAPP_CONTRIBUTOR_LIST,
    { variables: { campaignId }, skip: !campaignId, notifyOnNetworkStatusChange: true }
  );
  const [recordShare] = useMutation<RecordWhatsappShareData, RecordWhatsappShareVars>(RECORD_WHATSAPP_SHARE);
  const list = data?.whatsappContributorList ?? null;

  if (loading && !data) return <ShareSkeleton />;
  if (error && !data) {
    return <p className="py-8 text-center text-destructive">Could not load the contributor list: {error.message}</p>;
  }
  if (!list) return null;

  const empty = list.contributorCount === 0;
  const record = async (doneMessage: string) => {
    try {
      const { data: result } = await recordShare({ variables: { campaignId } });
      const response = result?.recordWhatsappShare;
      if (response?.success) toast.success(response.message || doneMessage);
      else toast.error(response?.message || RECORD_FAILED);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : RECORD_FAILED);
    }
  };

  const share = async () => {
    // Open first, inside the click, so pop-up blockers allow it.
    window.open(shareLink(list), "_blank", "noopener,noreferrer");
    setBusy("share");
    await record("Share recorded");
    setBusy(null);
  };

  const copy = async () => {
    setBusy("copy");
    try {
      await navigator.clipboard.writeText(list.text);
    } catch {
      toast.error("Could not copy the list. Select the text and copy it by hand.");
      setBusy(null);
      return;
    }
    await record("List copied. Paste it into the church group.");
    setBusy(null);
  };

  return (
    <div className="space-y-4">
      <Alert>
        <ShieldAlert />
        <AlertDescription>{PRIVACY_NOTE}</AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Contributor list</CardTitle>
              <CardDescription>
                Opens WhatsApp with the list ready to send. Pick the church group, then send.
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="self-start"
              disabled={loading || busy !== null}
              onClick={() => void refetch()}
            >
              <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
              Refresh
            </Button>
          </div>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Figure label="Contributors">{contributorsLabel(list.contributorCount)}</Figure>
            <Figure label="Total given">{formatKes(list.totalAmount)}</Figure>
            <Figure label="List made">As at {formatNairobiDateTime(list.asAt)}</Figure>
          </dl>
        </CardHeader>
        <CardContent className="space-y-4">
          {empty ? (
            <Empty
              icon={Users}
              title="Nobody has given yet"
              description="The list can be shared once the first gift to this campaign comes in."
            />
          ) : (
            <pre
              data-testid="whatsapp-preview"
              aria-label="Text that will be shared"
              className="max-h-96 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words"
            >
              {list.text}
            </pre>
          )}

          {!empty && mayBeTruncated(list) ? (
            <Alert>
              <TriangleAlert />
              <AlertDescription>
                This list is long, and WhatsApp may cut it short when it opens from the button. If it does, use
                Copy text and paste the list into the group instead.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button disabled={empty || busy !== null} onClick={() => void share()}>
              {busy === "share" ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
              Share list to WhatsApp
            </Button>
            <Button variant="outline" disabled={empty || busy !== null} onClick={() => void copy()}>
              {busy === "copy" ? <Loader2 className="size-4 animate-spin" /> : <Copy className="size-4" />}
              Copy text
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
