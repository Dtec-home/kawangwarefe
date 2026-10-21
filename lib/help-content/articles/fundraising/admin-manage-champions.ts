import type { HelpArticle } from "../../types";

export const FUNDRAISING_MANAGE_CHAMPIONS_ARTICLE: HelpArticle = {
  slug: "fundraising-manage-champions",
  title: "Managing campaign champions",
  category: "Fundraising",
  roles: ["admin"],
  relatedRoute: "/admin/campaigns",
  body: `Champions are members who raise money for a campaign among their family and friends, each with their own code and web page. Givers use the campaign code plus the champion's code on the church Pay Bill, for example account BUILD JOHN. Staff and the campaign's department admins manage champions.

**Turn champions on**
Champions work only when "Allow champions" is on. If it is off, open the Overview tab, tap Edit and switch it on.

**Open the Champions tab**
Go to Admin → Fundraising → Campaigns, open the campaign and choose "Champions". The table shows each champion's name, code, status, personal target, amount raised and donor count, with a link to their page.

**Invite a champion**
1. Tap "Invite a champion".
2. Enter their phone number. The member is found by their phone; a new number creates a new member record.
3. Choose their code: 2 to 9 capital letters or digits, for example JOHN. It must be unique in this campaign and can't be the campaign code. You'll see the account givers will use, for example "BUILD JOHN".
4. Add a personal target if you like (at least KES 1).
An invited champion is active straight away. You can invite champions before the campaign goes live, but not after it is closed.

**Approve members who ask to join**
Members can ask to become a champion from their own Champion pages while the campaign is active. They show as Pending until you tap Approve.

**Deactivate**
Tap Deactivate to stop a champion. Their code stops routing new Pay Bill payments: a payment to "BUILD JOHN" then goes to the unresolved Pay Bill queue for the treasurer to allocate. Gifts already made keep the champion, and the champion keeps the code. Approve brings an inactive champion back.

**What champions see**
A champion sees the names and amounts of the people who gave through their code. Givers are told this on the champion's page and on their SMS receipt. Champions also get a short SMS when new gifts come through them (totals only, at most every few hours, between 8am and 8pm). The public leaderboard shows champions' first names and last initials with their totals, never donors.`,
};
