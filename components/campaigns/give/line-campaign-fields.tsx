/**
 * LineCampaignFields — lets staff and recorders tag a manual-entry line with an active
 * fundraising campaign of that line's department (Fundraising S0 slot in
 * ContributionLinesForm, filled by S1-UI-B, ticket 1.13).
 *
 * Only lines whose department has active campaigns get a select. The list
 * comes from `givingCampaigns` (recorder-safe); if the viewer may not list
 * campaigns, nothing renders.
 * A line whose department changed away from its campaign has the campaign
 * cleared. Champion codes arrive in S5.
 */

"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import { Megaphone } from "lucide-react";
import type { CategoryAmount } from "@/components/forms/multi-category-selector";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ACTIVE_CAMPAIGNS_FOR_LINES,
  type ActiveCampaignsForLinesData,
  type LineCampaignOption,
} from "@/lib/graphql/fundraising/give";

export interface LineCampaignFieldsProps {
  lines: CategoryAmount[];
  onChange: (lines: CategoryAmount[]) => void;
}

/** Radix Select items can't carry "", so "no campaign" has its own value. */
const NO_CAMPAIGN = "none";

/**
 * Lines with any campaign that doesn't belong to the line's department
 * cleared, or null when every line is already consistent.
 */
export function staleCampaignLines(
  lines: CategoryAmount[],
  campaigns: Pick<LineCampaignOption, "id" | "categoryId">[]
): CategoryAmount[] | null {
  const isValid = (line: CategoryAmount) =>
    campaigns.some((c) => c.id === line.campaignId && c.categoryId === line.categoryId);
  const stale = lines.some((line) => line.campaignId && !isValid(line));
  if (!stale) return null;
  return lines.map((line) => (line.campaignId && !isValid(line) ? { ...line, campaignId: undefined } : line));
}

export function LineCampaignFields({ lines, onChange }: LineCampaignFieldsProps) {
  const { data } = useQuery<ActiveCampaignsForLinesData>(ACTIVE_CAMPAIGNS_FOR_LINES, {
    errorPolicy: "ignore",
  });
  const campaigns = data?.campaigns;

  const byDepartment = useMemo(() => {
    const map = new Map<string, LineCampaignOption[]>();
    for (const campaign of campaigns ?? []) {
      map.set(campaign.categoryId, [...(map.get(campaign.categoryId) ?? []), campaign]);
    }
    return map;
  }, [campaigns]);

  useEffect(() => {
    if (!campaigns) return;
    const cleaned = staleCampaignLines(lines, campaigns);
    if (cleaned) onChange(cleaned);
  }, [campaigns, lines, onChange]);

  const eligible = lines
    .map((line, index) => ({ line, index, options: byDepartment.get(line.categoryId) ?? [] }))
    .filter((entry) => entry.options.length > 0);

  if (eligible.length === 0) return null;

  const setCampaign = (index: number, value: string) => {
    const campaignId = value === NO_CAMPAIGN ? undefined : value;
    onChange(lines.map((line, i) => (i === index ? { ...line, campaignId } : line)));
  };

  return (
    <div data-slot="line-campaign-fields" className="space-y-3 rounded-lg border border-dashed bg-card p-4">
      <p className="flex items-center gap-2 text-sm font-medium">
        <Megaphone className="size-4 text-muted-foreground" />
        Fundraising campaign <span className="font-normal text-muted-foreground">(optional)</span>
      </p>
      {eligible.map(({ line, index, options }) => (
        <div
          key={index}
          data-testid={`line-campaign-${index}`}
          className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <Label htmlFor={`line-campaign-${index}`} className="text-sm text-muted-foreground">
            Line {index + 1} · {options[0].categoryName}
          </Label>
          <Select value={line.campaignId || NO_CAMPAIGN} onValueChange={(value) => setCampaign(index, value)}>
            <SelectTrigger id={`line-campaign-${index}`} className="w-full sm:w-64">
              <SelectValue placeholder="No campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CAMPAIGN}>No campaign</SelectItem>
              {options.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
