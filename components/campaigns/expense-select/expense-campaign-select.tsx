/**
 * ExpenseCampaignSelect — charge an expense to a fundraising campaign of the
 * expense's fund (Fundraising S0 slot in the expense dialogs, filled by
 * S4-UI-H, ticket 4.8).
 *
 * `value` is a campaign id or "" for none. Renders nothing until a fund is
 * chosen, when the fund has no campaigns, or when the viewer may not list
 * campaigns. Closed campaigns can still be chosen (late bills); drafts and
 * campaigns awaiting approval can't. The campaign an expense is already
 * charged to always shows, so the edit dialog's pre-fill displays.
 */

"use client";

import { useQuery } from "@apollo/client/react";

import { campaignStatusLabel } from "@/components/campaigns/admin/list/campaign-status-badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  EXPENSE_CAMPAIGN_OPTIONS,
  type ExpenseCampaignOption,
  type ExpenseCampaignOptionsData,
} from "@/lib/graphql/fundraising/closeout";

export interface ExpenseCampaignSelectProps {
  categoryId: string;
  value: string;
  onChange: (campaignId: string) => void;
}

export interface ExpenseCampaignChoice {
  campaign: ExpenseCampaignOption;
  disabled: boolean;
}

/** Radix Select items can't carry "", so "no campaign" has its own value. */
const NO_CAMPAIGN = "none";

/**
 * The campaigns of the fund in server order, plus the selected campaign if it
 * isn't one of them. Empty until a fund is chosen.
 */
const NOT_CHARGEABLE = new Set(["DRAFT", "PENDING_APPROVAL"]);

export function expenseCampaignChoices(
  campaigns: readonly ExpenseCampaignOption[],
  categoryId: string,
  value: string
): ExpenseCampaignChoice[] {
  if (!categoryId) return [];
  const listed = campaigns.filter((c) => c.categoryId === categoryId);
  const selected = value && !listed.some((c) => c.id === value) ? campaigns.find((c) => c.id === value) : undefined;
  return [...listed, ...(selected ? [selected] : [])].map((campaign) => ({
    campaign,
    // Closed campaigns still take late bills (S4-BE-H); drafts and campaigns
    // awaiting approval never take expenses.
    disabled: NOT_CHARGEABLE.has(campaign.status) && campaign.id !== value,
  }));
}

export function choiceLabel(campaign: ExpenseCampaignOption): string {
  return `${campaign.title} · ${campaignStatusLabel(campaign.status)}`;
}

export const ExpenseCampaignSelect: React.FC<ExpenseCampaignSelectProps> = ({ categoryId, value, onChange }) => {
  const { data } = useQuery<ExpenseCampaignOptionsData>(EXPENSE_CAMPAIGN_OPTIONS, {
    skip: !categoryId,
    errorPolicy: "ignore",
  });
  const choices = expenseCampaignChoices(data?.campaigns ?? [], categoryId, value);

  if (choices.length === 0) return null;

  return (
    <div className="space-y-2" data-slot="expense-campaign-select">
      <Label htmlFor="exp-campaign">
        Charge to campaign <span className="font-normal text-muted-foreground">(optional)</span>
      </Label>
      <Select value={value || NO_CAMPAIGN} onValueChange={(v) => onChange(v === NO_CAMPAIGN ? "" : v)}>
        <SelectTrigger id="exp-campaign">
          <SelectValue placeholder="No campaign" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_CAMPAIGN}>No campaign</SelectItem>
          {choices.map(({ campaign, disabled }) => (
            <SelectItem key={campaign.id} value={campaign.id} disabled={disabled}>
              {choiceLabel(campaign)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        The spend shows on that campaign&apos;s statement. A closed campaign can still take a late bill.
      </p>
    </div>
  );
};
