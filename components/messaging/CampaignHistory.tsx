"use client";

/**
 * CampaignHistory — paginated, status-filterable list of past campaigns.
 * Polls every 5 s while any campaign is in-flight.
 */

import { useQuery } from "@apollo/client/react";
import Link from "next/link";
import { ChevronRight, Send } from "lucide-react";

import { StatusBadge, statusToVariant } from "@/components/ui/status-badge";
import { Empty } from "@/components/ui/empty";
import { GET_MESSAGE_CAMPAIGNS } from "@/lib/graphql/messaging-mutations";

// "sending" is not a default domain string; surface it as info (in-flight).
const campaignVariant = (status: string) =>
  status === "sending" ? "info" : statusToVariant(status);

interface Campaign {
  id: string;
  status: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  template: { id: string; name: string };
}

const ACTIVE_STATUSES = new Set(["queued", "sending"]);

export function CampaignHistory() {
  const { data } = useQuery<{ messageCampaigns: Campaign[] }>(
    GET_MESSAGE_CAMPAIGNS,
    {
      pollInterval: 5000,
    }
  );

  const campaigns = data?.messageCampaigns ?? [];
  const hasActive = campaigns.some(c => ACTIVE_STATUSES.has(c.status));

  if (campaigns.length === 0) {
    return (
      <Empty
        icon={Send}
        title="No campaigns yet"
        description="Launch one from the Compose tab."
      />
    );
  }

  return (
    <div>
      {hasActive && (
        <p className="text-xs text-info mb-3">
          Live — refreshing every 5 s while campaigns are in flight.
        </p>
      )}
      <ul className="divide-y divide-border">
        {campaigns.map(c => (
          <li key={c.id}>
            <Link
              href={`/admin/messaging/${c.id}`}
              className="py-3 flex items-center justify-between gap-3 hover:bg-muted/50 rounded px-1 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium truncate">{c.template.name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.sentCount}/{c.recipientCount} sent
                  {c.failedCount > 0 && (
                    <span className="text-destructive"> · {c.failedCount} failed</span>
                  )}
                  {" · "}
                  {new Date(c.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge variant={campaignVariant(c.status)}>{c.status}</StatusBadge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
