/**
 * One campaign update in the admin timeline, with its remove action
 * (Fundraising S2, lane S2-UI-D, ticket 2.12).
 */

"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { Loader2, MessageSquareText, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  REMOVE_CAMPAIGN_UPDATE,
  type RemoveCampaignUpdateData,
  type RemoveCampaignUpdateVars,
} from "@/lib/graphql/fundraising/updates";
import { formatNairobiDateTime } from "@/lib/receipts/format";
import type { CampaignUpdate } from "@/lib/types/fundraising";

const REMOVE_FAILED = "Could not remove the update";

/** Plain-text body split into paragraphs on blank lines. */
export function bodyParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function postedLine(update: CampaignUpdate): string {
  const by = `Posted by ${update.postedByName || "Unknown"}`;
  return update.publishedAt ? `${by} on ${formatNairobiDateTime(update.publishedAt)}` : by;
}

interface UpdateItemProps {
  update: CampaignUpdate;
  onRemoved: () => void;
}

export function UpdateItem({ update, onRemoved }: UpdateItemProps) {
  const [confirming, setConfirming] = useState(false);
  const [removeUpdate, { loading }] = useMutation<RemoveCampaignUpdateData, RemoveCampaignUpdateVars>(
    REMOVE_CAMPAIGN_UPDATE
  );

  const remove = async () => {
    try {
      const { data } = await removeUpdate({ variables: { id: update.id } });
      const result = data?.removeCampaignUpdate;
      if (result?.success) {
        toast.success(result.message || "Update removed");
        setConfirming(false);
        onRemoved();
      } else {
        toast.error(result?.message || REMOVE_FAILED);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : REMOVE_FAILED);
    }
  };

  return (
    <li>
      <article className="space-y-3 rounded-lg border bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold leading-tight">{update.title}</h3>
              {update.smsSentAt ? (
                <Badge variant="secondary">
                  <MessageSquareText className="size-3" />
                  SMS sent
                </Badge>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">{postedLine(update)}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="self-start text-destructive hover:text-destructive"
            aria-label={`Remove "${update.title}"`}
            disabled={loading}
            onClick={() => setConfirming(true)}
          >
            <Trash2 className="size-4" />
            Remove
          </Button>
        </div>

        {update.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={update.imageUrl}
            alt=""
            loading="lazy"
            className="max-h-72 w-full rounded-md border object-cover"
          />
        ) : null}

        <div className="space-y-2 text-sm leading-relaxed">
          {bodyParagraphs(update.body).map((paragraph, i) => (
            <p key={i} className="whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>
      </article>

      <AlertDialog open={confirming} onOpenChange={(open) => !loading && setConfirming(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this update?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{update.title}&rdquo; will no longer show on the campaign page.
              {update.smsSentAt ? " The SMS already sent to donors cannot be recalled." : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={remove} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Remove update
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
}
