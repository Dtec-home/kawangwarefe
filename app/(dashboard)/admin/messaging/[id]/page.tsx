/**
 * Campaign detail page (Sprint 8 / Epic E6).
 *
 * Staff-only. Shows progress, per-recipient table, and a CSV export
 * of failed recipients so operators can follow up offline.
 */

"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import Link from "next/link";

import { AdminLayout } from "@/components/layouts/admin-layout";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import {
  StatusBadge,
  statusToVariant,
  type StatusVariant,
} from "@/components/ui/status-badge";
import { Empty } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { GET_MESSAGE_CAMPAIGN } from "@/lib/graphql/messaging-mutations";
import { ArrowLeft, Download, Inbox } from "lucide-react";

interface Recipient {
  id: string;
  phoneNumber: string;
  status: string;
  renderedBody: string;
  providerMessageId: string;
  error: string;
  sentAt: string | null;
}

interface CampaignDetail {
  id: string;
  status: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  recipientFilterJson: string;
  template: { id: string; name: string; body: string };
}

interface DetailData {
  messageCampaign: CampaignDetail | null;
  messageCampaignRecipients: Recipient[];
}

// Overrides for statuses the shared statusToVariant map doesn't cover.
const STATUS_VARIANT_OVERRIDES: Record<string, StatusVariant> = {
  skipped: "warning",
  sending: "info",
};

function campaignStatusVariant(status: string): StatusVariant {
  return STATUS_VARIANT_OVERRIDES[status.toLowerCase()] ?? statusToVariant(status);
}

/**
 * CSV export of failed recipients. Pure — exported for unit tests.
 */
export function buildFailuresCsv(recipients: Recipient[]): string {
  const header = "phone_number,error,rendered_body";
  const rows = recipients
    .filter((r) => r.status === "failed")
    .map((r) => {
      const esc = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;
      return [esc(r.phoneNumber), esc(r.error), esc(r.renderedBody)].join(",");
    });
  return [header, ...rows].join("\n");
}

function triggerCsvDownload(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function CampaignDetailContent() {
  const params = useParams<{ id: string }>();
  const campaignId = params?.id ?? "";

  const { data, loading } = useQuery<DetailData>(GET_MESSAGE_CAMPAIGN, {
    variables: { campaignId },
    pollInterval: 4000,
    skip: !campaignId,
  });

  const campaign = data?.messageCampaign;
  const recipients = data?.messageCampaignRecipients ?? [];

  const failuresCsv = useMemo(() => buildFailuresCsv(recipients), [recipients]);

  if (loading && !campaign) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-72 rounded-lg" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }
  if (!campaign) {
    return (
      <Empty
        icon={Inbox}
        title="Campaign not found"
        description="This campaign may have been removed or never existed."
        action={
          <Link href="/admin/messaging">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to messaging
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link
          href="/admin/messaging"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to messaging
        </Link>
        <PageHeader
          title={`Campaign #${campaign.id} — ${campaign.template.name}`}
          actions={
            <StatusBadge variant={campaignStatusVariant(campaign.status)}>
              {campaign.status}
            </StatusBadge>
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress</CardTitle>
          <CardDescription>
            {campaign.sentCount} sent · {campaign.failedCount} failed · {" "}
            {campaign.recipientCount} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted rounded p-2 whitespace-pre-wrap">
            {campaign.template.body}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recipients ({recipients.length})</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={campaign.failedCount === 0}
            onClick={() =>
              triggerCsvDownload(
                `campaign-${campaign.id}-failures.csv`,
                failuresCsv,
              )
            }
          >
            <Download className="h-4 w-4 mr-2" />
            Export failures (CSV)
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {recipients.length === 0 ? (
            <Empty
              icon={Inbox}
              title="No recipients yet"
              description="Recipients will appear here once the campaign begins sending."
            />
          ) : (
            <table className="w-full text-sm" aria-label="Recipients table">
              <thead>
                <tr className="text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2">Phone</th>
                  <th>Status</th>
                  <th>Provider ID</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {recipients.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="py-2 font-mono text-xs">{r.phoneNumber || "—"}</td>
                    <td>
                      <StatusBadge variant={campaignStatusVariant(r.status)}>
                        {r.status}
                      </StatusBadge>
                    </td>
                    <td className="font-mono text-xs">{r.providerMessageId || "—"}</td>
                    <td className="text-xs text-destructive">{r.error || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CampaignDetailPage() {
  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <CampaignDetailContent />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
