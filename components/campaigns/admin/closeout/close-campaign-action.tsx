/**
 * The "Close campaign" action with its confirmation (Fundraising S4, lane
 * S4-UI-H, ticket 4.9).
 *
 * The dialog spells out decision 6 before anything happens: any money left
 * over stays in the department and nothing is moved; the campaign stops
 * taking gifts; later Pay Bill payments to its code wait in the unmatched list.
 */

"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { AlertCircle, Archive, Loader2 } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  CLOSE_CAMPAIGN,
  type CloseCampaignData,
  type CloseCampaignVars,
  type CloseoutCampaign,
} from "@/lib/graphql/fundraising/closeout";
import type { CampaignStatus } from "@/lib/types/fundraising";

const CLOSE_FAILED = "Could not close the campaign";

/** Only a campaign that is live (taking gifts or paused) can be closed. */
export function isClosable(status: CampaignStatus): boolean {
  return status === "ACTIVE" || status === "PAUSED";
}

interface CloseCampaignActionProps {
  campaign: CloseoutCampaign;
  onClosed: () => void;
}

export function CloseCampaignAction({ campaign, onClosed }: CloseCampaignActionProps) {
  const [confirming, setConfirming] = useState(false);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [closeCampaign, { loading }] = useMutation<CloseCampaignData, CloseCampaignVars>(CLOSE_CAMPAIGN);

  const refuse = (message: string) => {
    setRefusal(message);
    setConfirming(false);
    toast.error(message);
  };

  const close = async () => {
    setRefusal(null);
    try {
      const { data } = await closeCampaign({ variables: { id: campaign.id } });
      const result = data?.closeCampaign;
      if (result?.success) {
        toast.success(result.message || "Campaign closed");
        setConfirming(false);
        onClosed();
      } else {
        refuse(result?.message || CLOSE_FAILED);
      }
    } catch (err) {
      refuse(err instanceof Error ? err.message : CLOSE_FAILED);
    }
  };

  return (
    <div className="space-y-3">
      <Button variant="destructive" disabled={loading} onClick={() => setConfirming(true)}>
        <Archive className="size-4" />
        Close campaign
      </Button>

      {refusal ? (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{refusal}</AlertDescription>
        </Alert>
      ) : null}

      <AlertDialog open={confirming} onOpenChange={(open) => !loading && setConfirming(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close &ldquo;{campaign.title}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p className="font-medium text-foreground">
                  Any money left over stays in {campaign.categoryName}; nothing is moved.
                </p>
                <p>
                  The campaign stops taking gifts. Any later Pay Bill payment to{" "}
                  <span className="font-mono font-medium text-foreground">{campaign.paybillCode}</span> is no
                  longer credited to it and waits in the unmatched Pay Bill list for staff to allocate.
                </p>
                <p>A closed campaign can&apos;t be reopened.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={close} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Close campaign
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
