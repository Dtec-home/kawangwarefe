import type { HelpArticle } from "../../types";

export const FUNDRAISING_CAMPAIGN_STATEMENT_ARTICLE: HelpArticle = {
  slug: "fundraising-campaign-statement",
  title: "Reading and exporting a campaign statement",
  category: "Fundraising",
  roles: ["admin"],
  relatedRoute: "/admin/campaigns",
  body: `Each campaign has its own statement: every gift in, every expense out, and the running balance. It is the campaign's ledger for the treasurer, the committee and auditors. Staff and the campaign's department admins can see it; it names givers, so don't share it publicly.

**1. Open the Statement tab**
Go to Admin → Fundraising → Campaigns, open the campaign and choose "Statement".

**2. Choose the period**
"All time" is the default. Set From and/or To to look at part of the campaign. With a From date, the first row is "Balance brought forward" (everything before that date).

**3. Read it**
- Tiles: Money in, Money out, Balance, and Pledged vs received.
- Charts: money in over time, and money in by channel. Each chart has "Show as table".
- The table: Date, Description, Channel, In, Out and Balance. A gift reads like a Cash Statement row, for example "Receipt 20261021-0004 · M-Pesa Pay Bill · MARY WANJIKU". Gifts not yet receipted say so.
- Money out lists expenses charged to the campaign; those paid out through KCB are marked as payouts.

**4. Export**
Tap Export Excel or Export PDF. The file follows the period you chose and has the church name, the campaign title and code, the department, and a total row. Each export is written to the audit log.

**Charging an expense to a campaign**
When you create or edit an expense, choose the campaign in the expense dialog. Only approved campaigns of the expense's own department can be chosen. Charging moves no money: the expense still comes out of the department; it simply appears on the campaign's statement too.

**Why it always agrees with the books**
Campaign money is department money with a tag. A daily check makes sure no campaign shows more than its department received, and that every campaign gift is in the right department. If a gift was recorded against the wrong department, it is reported in the daily finance SMS.`,
};
