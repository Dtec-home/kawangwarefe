/**
 * The automatic WhatsApp group leaderboard for staff (DEPARTMENT_CAMPAIGNS
 * DC-4, D4): which group gets it, and how the newest post went. Gifts are
 * batched, so one post covers every gift of its minute; a failed post shows why.
 */

import { MessageCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, statusToVariant } from "@/components/ui/status-badge";
import { formatNairobiDateTime } from "@/lib/receipts/format";
import type { Campaign, LeaderboardPost } from "@/lib/types/fundraising";

const POST_STATUS_LABELS: Record<string, string> = {
  queued: "Waiting to send",
  sent: "Sent",
  failed: "Failed",
  skipped: "Not sent",
};

export function leaderboardPostLabel(post: LeaderboardPost): string {
  return POST_STATUS_LABELS[post.status] ?? post.status;
}

/** "…742692@g.us": enough to tell groups apart. */
export function shortGroupId(groupId: string): string {
  const [user, server] = groupId.split("@");
  return user.length > 6 ? `…${user.slice(-6)}@${server ?? ""}` : groupId;
}

export function LeaderboardDeliveryCard({
  campaign,
}: {
  campaign: Pick<Campaign, "whatsappGroupId" | "lastLeaderboardPost">;
}) {
  const post = campaign.lastLeaderboardPost;
  return (
    <Card data-testid="leaderboard-delivery">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="size-4" /> WhatsApp group updates
        </CardTitle>
        <CardDescription>
          {campaign.whatsappGroupId
            ? `Posts the leaderboard to group ${shortGroupId(campaign.whatsappGroupId)} about a minute after gifts.`
            : "No WhatsApp group set. Add the group id on the campaign form to post the leaderboard after gifts."}
        </CardDescription>
      </CardHeader>
      {campaign.whatsappGroupId ? (
        <CardContent className="space-y-2 text-sm">
          {post ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">Latest post</span>
                <StatusBadge variant={statusToVariant(post.status)}>{leaderboardPostLabel(post)}</StatusBadge>
                <span>{formatNairobiDateTime(post.sentAt ?? post.createdAt)}</span>
                {post.attempts > 1 ? <span className="text-muted-foreground">after {post.attempts} tries</span> : null}
              </div>
              {post.lastError && post.status !== "sent" ? (
                <p className="text-xs text-muted-foreground" data-testid="leaderboard-error">
                  {post.lastError}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-muted-foreground">Nothing posted yet. The first gift sends the first update.</p>
          )}
        </CardContent>
      ) : null}
    </Card>
  );
}
