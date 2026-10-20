/**
 * ExpenseCampaignSelect — charge an expense to a fundraising campaign of the
 * expense's fund (Fundraising S0 slot in the expense dialogs).
 *
 * Owned by lane S4-UI-H. `value` is a campaign id or "" for none. Renders
 * nothing until then.
 */

"use client";

export interface ExpenseCampaignSelectProps {
  categoryId: string;
  value: string;
  onChange: (campaignId: string) => void;
}

export const ExpenseCampaignSelect: React.FC<ExpenseCampaignSelectProps> = () => null;
