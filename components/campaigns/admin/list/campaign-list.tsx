/**
 * Campaign list with status filter and search (Fundraising S1, ticket 1.9).
 *
 * Each campaign shows its code, department, status, progress (shared
 * `CampaignProgress`) and end date, and links to /admin/campaigns/[id].
 * The backend limits category admins to their own departments.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { Plus, Search, Target } from "lucide-react";

import { CampaignProgress } from "@/components/campaigns/shared/campaign-progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GET_CAMPAIGNS,
  type CampaignListItem,
  type CampaignsData,
  type CampaignsVars,
} from "@/lib/graphql/fundraising/campaigns";
import { formatEntryDate } from "@/lib/treasury/entry-dates";
import type { CampaignStatus } from "@/lib/types/fundraising";

import { CAMPAIGN_STATUS_LABELS, CampaignStatusBadge } from "./campaign-status-badge";

const ALL = "all";
export const NEW_CAMPAIGN_HREF = "/admin/campaigns/new";

export function campaignHref(id: string): string {
  return `/admin/campaigns/${encodeURIComponent(id)}`;
}

function endDateLabel(endDate: string | null): string {
  return endDate ? formatEntryDate(endDate) : "No end date";
}

export function NewCampaignButton() {
  return (
    <Button asChild>
      <Link href={NEW_CAMPAIGN_HREF}>
        <Plus className="size-4" /> New campaign
      </Link>
    </Button>
  );
}

function TitleLink({ campaign }: { campaign: CampaignListItem }) {
  return (
    <Link href={campaignHref(campaign.id)} className="font-medium hover:underline">
      {campaign.title}
    </Link>
  );
}

export function CampaignList() {
  const [status, setStatus] = useState<string>(ALL);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const variables: CampaignsVars = {
    status: status === ALL ? null : (status as CampaignStatus),
    search: search || null,
  };
  const { data, loading, error } = useQuery<CampaignsData, CampaignsVars>(GET_CAMPAIGNS, {
    variables,
    fetchPolicy: "cache-and-network",
  });
  const campaigns = data?.campaigns ?? [];
  const filtered = status !== ALL || search !== "";

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const clearFilters = () => {
    setStatus(ALL);
    setSearchInput("");
    setSearch("");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <form onSubmit={applySearch} className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1">
                <Label htmlFor="campaign-search">Search</Label>
                <Input
                  id="campaign-search"
                  type="search"
                  value={searchInput}
                  placeholder="Title or Pay Bill code"
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <Button type="submit" variant="outline">
                <Search className="size-4" />
                Search
              </Button>
            </form>
            <div className="space-y-1 sm:w-56">
              <Label htmlFor="campaign-status">Status</Label>
              <Select name="status" value={status} onValueChange={setStatus}>
                <SelectTrigger id="campaign-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All statuses</SelectItem>
                  {Object.entries(CAMPAIGN_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading && !data && (
            <div className="space-y-2" data-testid="campaigns-loading">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          )}

          {error && !data && (
            <p className="py-8 text-center text-destructive">Could not load campaigns: {error.message}</p>
          )}

          {data && campaigns.length === 0 &&
            (filtered ? (
              <Empty
                icon={Target}
                title="No campaigns match"
                description="Try another status, or clear the search."
                action={
                  <Button variant="outline" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <Empty
                icon={Target}
                title="No campaigns yet"
                description="Start a campaign for a building, a mission or any drive with a target and a deadline."
                action={<NewCampaignButton />}
              />
            ))}

          {campaigns.length > 0 && (
            <>
              {/* Mobile cards */}
              <ul className="space-y-3 md:hidden">
                {campaigns.map((campaign) => (
                  <li key={campaign.id} className="rounded-lg border p-3 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <TitleLink campaign={campaign} />
                        <p className="text-xs text-muted-foreground">
                          <span className="font-mono">{campaign.paybillCode}</span> · {campaign.categoryName}
                        </p>
                      </div>
                      <CampaignStatusBadge status={campaign.status} />
                    </div>
                    <CampaignProgress progress={campaign.progress} />
                    <p className="text-xs text-muted-foreground">Ends {endDateLabel(campaign.endDate)}</p>
                  </li>
                ))}
              </ul>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="p-3 font-medium">Campaign</th>
                      <th className="p-3 font-medium">Code</th>
                      <th className="p-3 font-medium">Department</th>
                      <th className="p-3 font-medium">Status</th>
                      <th className="p-3 font-medium min-w-64">Progress</th>
                      <th className="p-3 font-medium">Ends</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign) => (
                      <tr key={campaign.id} className="border-b align-top hover:bg-muted/60">
                        <td className="p-3">
                          <TitleLink campaign={campaign} />
                        </td>
                        <td className="p-3 font-mono whitespace-nowrap">{campaign.paybillCode}</td>
                        <td className="p-3">{campaign.categoryName}</td>
                        <td className="p-3">
                          <CampaignStatusBadge status={campaign.status} />
                        </td>
                        <td className="p-3">
                          <CampaignProgress progress={campaign.progress} />
                        </td>
                        <td className="p-3 whitespace-nowrap">{endDateLabel(campaign.endDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
