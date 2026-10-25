import type { HelpArticle } from "../../types";

export const FUNDRAISING_PLEDGE_REGISTER_ARTICLE: HelpArticle = {
  slug: "fundraising-pledge-register",
  title: "Recording pledge cards and using the pledge register",
  category: "Fundraising",
  roles: ["admin"],
  relatedRoute: "/admin/pledges",
  body: `A pledge is a promise to give an amount, optionally by a due date, to a campaign or to a department. The pledge register shows who pledged what, what has been paid and what is outstanding. Staff and department admins (for their own departments) can use it.

Find it at Admin → Fundraising → Pledges, or on a campaign's Pledges tab (which shows only that campaign).

**Recording a paper pledge card**
1. Tap "Record a pledge card".
2. Enter the giver's phone number. If the number is new, also enter the Member name; otherwise the existing member is used.
3. Choose Pledge for: a Campaign (active campaigns only) or a Department.
4. Enter the amount and, if the card has one, the due date. The due date cannot be in the past.
5. Save. The pledge shows with source "Pledge card".

**Reading the register**
- The totals at the top: number of pledges, Pledged, Paid and Outstanding.
- The table: member, what it is for, pledged, paid, balance, due date, status and source (Online, Public page, Pledge card, USSD or Mobile app).
- Filter by campaign, department and status, or search by member name or phone.
- Statuses: Open, Overdue (past the due date with a balance), Fulfilled (paid in full), Cancelled, and Awaiting code (a public-page pledge whose SMS code was never confirmed; it counts nowhere).

**How payments reach a pledge**
Nobody has to match payments by hand. When a gift is receipted, it pays the giver's oldest open pledges first: a campaign gift pays that campaign's pledges, and an ordinary department gift pays that department's pledges. Anything extra stays as a normal gift. Voiding the receipt takes the payment off the pledge again.

**Reminders**
Reminders go out by SMS following the campaign's policy (by default once a month, 3 days before the due date, and once if overdue), only between 8am and 8pm. If someone calls the church office to stop them, ask a system admin to switch reminders off for that pledge; there is no button for it on this page yet.

**Cancelling a pledge**
Use Cancel pledge on the row and give a reason of at least 5 characters. Money already paid stays recorded and no more reminders are sent. The reason is saved in the audit log.

**Export**
Use Export Excel or Export PDF. The export follows the campaign and department filters.`,
};
