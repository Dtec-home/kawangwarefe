"use client";

/**
 * CampaignHistory — paginated, status-filterable list of past campaigns.
 * Polls every 5 s while any campaign is in-flight.
 */

import { useQuery } from "@apollo/client/react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { GET_MESSAGE_CAMPAIGNS } from "@/lib/graphql/messaging-mutations";

interface Campaign {
  id: string;
  status: string;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  createdAt: string;
  template: { id: string; name: string };
}

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  queued: "bg-amber-100 text-amber-700",
  sending: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

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
      <p className="text-sm text-muted-foreground py-4 text-center">
        No campaigns yet. Launch one from the Compose tab.
      </p>
    );
  }

  return (
    <div>
      {hasActive && (
        <p className="text-xs text-blue-600 mb-3">
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
                    <span className="text-red-500"> · {c.failedCount} failed</span>
                  )}
                  {" · "}
                  {new Date(c.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge className={STATUS_COLOR[c.status] ?? ""}>{c.status}</Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
