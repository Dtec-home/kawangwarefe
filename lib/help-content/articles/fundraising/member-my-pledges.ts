import type { HelpArticle } from "../../types";

export const FUNDRAISING_MY_PLEDGES_ARTICLE: HelpArticle = {
  slug: "fundraising-my-pledges",
  title: "Making and paying a pledge (My pledges)",
  category: "Fundraising",
  roles: ["member"],
  relatedRoute: "/pledges",
  body: `A pledge is a promise to give an amount over time, to a campaign or to a department. My pledges shows what you have promised, what you have paid and what is left.

**Make a pledge**
1. Open My pledges from the menu and tap "Make a pledge".
2. Choose Pledge to: a campaign or a department, then pick which one.
3. Enter the amount and, if you like, a due date (not in the past).
4. Save. Your pledge appears on the list.

**On a campaign page, without logging in**
Under "Pledge to give later", enter your name, phone, amount and an optional "give by" date, then tap "Send me a code". Enter the 6-digit code from the SMS and tap "Confirm pledge". The code lasts 10 minutes; use "Send a new code" if it expires.

**Pay towards your pledge**
Tap "Pay balance" on the pledge to open the campaign's give page (or the normal Give page for a department pledge), or just give as usual (M-Pesa prompt, Pay Bill with the campaign's account code, or at the desk). Every gift to that campaign pays your oldest pledge to it first. For a department pledge, an ordinary gift to that department counts. You don't need to mention the pledge.

**Your list**
Each pledge shows Pledged, Paid and Balance, the due date, and its status: Open, Overdue (past the due date with money still to pay) or Fulfilled (paid in full).

**Reminders**
We'll remind you by SMS: by default once a month, 3 days before your due date, and once if it becomes overdue. Reminders are only sent between 8am and 8pm. To stop them, call the church office.

**Cancel a pledge**
Tap "Cancel pledge" on an open or overdue pledge and give a short reason (at least 5 characters). What you have already given stays given, and the church office sees your reason.`,
};
