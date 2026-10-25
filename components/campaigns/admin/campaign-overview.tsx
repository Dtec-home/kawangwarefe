/**
 * CampaignOverview — the Overview tab of /admin/campaigns/[id]
 * (Fundraising S1, ticket 1.11, lane S1-UI-A).
 *
 * Details, progress with pledges, how to give, the public link, and the
 * lifecycle actions the campaign's status allows: submit (draft), approve and
 * return to draft (awaiting approval), pause / resume, and edit. Approval
 * follows the four-eyes rule (Decision 2): `campaign.canApprove` is false for
 * the creator and for anyone who is not an admin or pastor. Closing is on the
 * Close out tab (S4). The backend re-checks every permission.
 */

"use client";

import { useState } from "react";
import { useApolloClient, useQuery } from "@apollo/client/react";
import type { DocumentNode } from "graphql";
import { CheckCircle2, Copy, Loader2, Pause, Pencil, Play, Send, ShieldAlert, Target, Undo2 } from "lucide-react";
import { toast } from "sonner";

import type { CampaignTabProps } from "@/components/campaigns/admin/types";
import { EditCampaign } from "@/components/campaigns/admin/form/edit-campaign";
import { ReturnToDraftDialog } from "@/components/campaigns/admin/form/return-to-draft-dialog";
import { CampaignStatusBadge } from "@/components/campaigns/admin/list/campaign-status-badge";
import { CampaignProgress } from "@/components/campaigns/shared/campaign-progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  APPROVE_CAMPAIGN,
  GET_CAMPAIGN,
  PAUSE_CAMPAIGN,
  RESUME_CAMPAIGN,
  SUBMIT_CAMPAIGN,
  type CampaignActionData,
  type CampaignData,
  type CampaignVars,
} from "@/lib/graphql/fundraising/campaigns";
import { formatKes, formatNairobiDateTime } from "@/lib/receipts/format";
import { formatEntryDate } from "@/lib/treasury/entry-dates";
import type { Campaign } from "@/lib/types/fundraising";

interface StatusAction {
  key: string;
  label: string;
  icon: typeof Send;
  mutation: DocumentNode;
  field: string;
  done: string;
  variant?: "default" | "outline";
}

const SUBMIT: StatusAction = {
  key: "submit",
  label: "Submit for approval",
  icon: Send,
  mutation: SUBMIT_CAMPAIGN,
  field: "submitCampaign",
  done: "Submitted for approval",
};
const APPROVE: StatusAction = {
  key: "approve",
  label: "Approve",
  icon: CheckCircle2,
  mutation: APPROVE_CAMPAIGN,
  field: "approveCampaign",
  done: "Campaign approved",
};
const PAUSE: StatusAction = {
  key: "pause",
  label: "Pause",
  icon: Pause,
  mutation: PAUSE_CAMPAIGN,
  field: "pauseCampaign",
  done: "Campaign paused",
  variant: "outline",
};
const RESUME: StatusAction = {
  key: "resume",
  label: "Resume",
  icon: Play,
  mutation: RESUME_CAMPAIGN,
  field: "resumeCampaign",
  done: "Campaign resumed",
};

/** The one-click status actions this campaign offers. */
export function statusActionsFor(campaign: Pick<Campaign, "status" | "canApprove">): StatusAction[] {
  switch (campaign.status) {
    case "DRAFT":
      return [SUBMIT];
    case "PENDING_APPROVAL":
      return campaign.canApprove ? [APPROVE] : [];
    case "ACTIVE":
      return [PAUSE];
    case "PAUSED":
      return [RESUME];
    default:
      return [];
  }
}

const REMINDER_FREQUENCY_LABELS: Record<string, string> = {
  monthly: "Monthly",
  weekly: "Weekly",
  none: "No regular reminders",
};

function datesLabel(campaign: Campaign): string {
  const start = campaign.startDate ? formatEntryDate(campaign.startDate) : "Not set";
  const end = campaign.endDate ? formatEntryDate(campaign.endDate) : "No end date";
  return `${start} to ${end}`;
}

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-4" data-testid="campaign-loading">
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export const CampaignOverview: React.FC<CampaignTabProps> = ({ campaignId }) => {
  const client = useApolloClient();
  const [editing, setEditing] = useState(false);
  const [returning, setReturning] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const { data, loading, error, refetch } = useQuery<CampaignData, CampaignVars>(GET_CAMPAIGN, {
    variables: { id: campaignId },
    skip: !campaignId,
  });
  const campaign = data?.campaign ?? null;

  if (loading && !data) return <OverviewSkeleton />;
  if (error && !data) {
    return <p className="py-8 text-center text-destructive">Could not load the campaign: {error.message}</p>;
  }
  if (!campaign) {
    return <Empty icon={Target} title="Campaign not found" description="It may have been removed, or you may not have access." />;
  }

  const run = async (action: StatusAction) => {
    setBusy(action.key);
    try {
      const { data: result } = await client.mutate<CampaignActionData>({
        mutation: action.mutation,
        variables: { id: campaign.id },
      });
      const response = result?.[action.field];
      if (response?.success) {
        toast.success(response.message || action.done);
        await refetch();
      } else {
        toast.error(response?.message || `Could not ${action.label.toLowerCase()}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Could not ${action.label.toLowerCase()}`);
    } finally {
      setBusy(null);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(campaign.publicUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  };

  const actions = statusActionsFor(campaign);
  const pending = campaign.status === "PENDING_APPROVAL";
  const policy = campaign.reminderPolicy;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight">{campaign.title}</h2>
                <span data-testid="campaign-status">
                  <CampaignStatusBadge status={campaign.status} />
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-mono">{campaign.paybillCode}</span> · {campaign.categoryName}
                {campaign.purposeName ? ` · ${campaign.purposeName}` : ""}
              </p>
            </div>
            {!editing ? (
              <div className="flex flex-wrap gap-2">
                {actions.map((action) => (
                  <Button
                    key={action.key}
                    variant={action.variant ?? "default"}
                    disabled={busy !== null}
                    onClick={() => run(action)}
                  >
                    {busy === action.key ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <action.icon className="size-4" />
                    )}
                    {action.label}
                  </Button>
                ))}
                {pending ? (
                  <Button variant="outline" disabled={busy !== null} onClick={() => setReturning(true)}>
                    <Undo2 className="size-4" />
                    Return to draft
                  </Button>
                ) : null}
                {campaign.status !== "CLOSED" ? (
                  <Button variant="outline" disabled={busy !== null} onClick={() => setEditing(true)}>
                    <Pencil className="size-4" />
                    Edit
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
          {pending && !campaign.canApprove ? (
            <Alert>
              <ShieldAlert />
              <AlertDescription>
                Waiting for approval. Another admin or pastor must approve this campaign: whoever created a
                campaign cannot approve it (four-eyes rule).
              </AlertDescription>
            </Alert>
          ) : null}
        </CardHeader>
        <CardContent>
          <CampaignProgress progress={campaign.progress} showPledged />
        </CardContent>
      </Card>

      {editing ? (
        <EditCampaign
          campaign={campaign}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            void refetch();
          }}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Details</CardTitle>
              {campaign.summary ? <CardDescription>{campaign.summary}</CardDescription> : null}
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <Detail label="Target">{formatKes(campaign.targetAmount)}</Detail>
                <Detail label="Dates">{datesLabel(campaign)}</Detail>
                <Detail label="On the public website">{yesNo(campaign.isPublic)}</Detail>
                <Detail label="Pledges">{campaign.allowPledges ? "Allowed" : "Not allowed"}</Detail>
                <Detail label="Champions">{campaign.allowChampions ? "Allowed" : "Not allowed"}</Detail>
                <Detail label="Pledge reminders">
                  {REMINDER_FREQUENCY_LABELS[policy.frequency] ?? policy.frequency}, {policy.daysBeforeDue} days
                  before due, {policy.overdueNotices} overdue {policy.overdueNotices === 1 ? "notice" : "notices"}
                </Detail>
                <Detail label="Created by">
                  {campaign.createdByName || "Unknown"} on {formatNairobiDateTime(campaign.createdAt)}
                </Detail>
                {campaign.approvedAt ? (
                  <Detail label="Approved by">
                    {campaign.approvedByName || "Unknown"} on {formatNairobiDateTime(campaign.approvedAt)}
                  </Detail>
                ) : null}
              </dl>
              {campaign.story ? (
                <p className="mt-6 whitespace-pre-line text-sm leading-relaxed">{campaign.story}</p>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>How to give</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <dl className="grid grid-cols-2 gap-3">
                  <Detail label="Pay Bill">
                    <span className="font-mono font-semibold">{campaign.paymentInstructions.paybillNumber}</span>
                  </Detail>
                  <Detail label="Account">
                    <span className="font-mono font-semibold">{campaign.paymentInstructions.accountReference}</span>
                  </Detail>
                </dl>
                <p className="text-sm text-muted-foreground">{campaign.paymentInstructions.text}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Public link</CardTitle>
                {!campaign.isPublic || campaign.status !== "ACTIVE" ? (
                  <CardDescription>Visitors can give here once the campaign is active and public.</CardDescription>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="break-all font-mono text-sm">{campaign.publicUrl}</p>
                <Button variant="outline" size="sm" onClick={copyLink}>
                  <Copy className="size-4" /> Copy link
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <ReturnToDraftDialog
        campaignId={campaign.id}
        open={returning}
        onOpenChange={setReturning}
        onReturned={() => void refetch()}
      />
    </div>
  );
};
