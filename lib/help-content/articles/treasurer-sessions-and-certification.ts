import type { HelpArticle } from "../types";

export const TREASURER_SESSIONS_AND_CERTIFICATION_ARTICLE: HelpArticle = {
  slug: "treasurer-sessions-and-certification",
  title: "Confirming handovers and certifying a statement",
  category: "Treasury",
  roles: ["admin"],
  relatedRoute: "/admin/collection-sessions",
  body: `After a collection, recorders close their session and count the cash. The treasurer then confirms receiving the cash and, once the day's books are right, certifies the statement for that date.

**Collection sessions (Admin → Finance → Collection sessions)**
Sessions are grouped by date for the chosen week (use Previous week / This week, or pick From and To). Each date shows whether its statement is certified. For each session you see who opened it, its status (Open, Closed, Confirmed), the number of receipts, the Recorded total, the Counted cash, the Variance (cash short or over) and the recorder's reason for any variance.

**Confirming a handover (treasurer and admin)**
When you have physically received the counted cash for a Closed session, click "Confirm handover". The session becomes Confirmed and your name is recorded — this replaces the paper handover signature. Confirmed sessions supply "cash in hand" on the statement's summary page. Follow up any variance with the recorder before confirming.

**Certifying a statement (treasurer and admin)**
On Admin → Reports → Exports, in the Treasurer's Cash Statement card, choose Single date. The certification status for that date is shown. When everything is checked:
1. Make sure every collection session for the date is closed.
2. Click "Certify statement", read the warning and click "Certify and lock".

Certifying locks the date:
- No more manual or recorder entries can be recorded for it, even in a catch-up window.
- No receipts for that date can be voided, and voids can't be requested.
- The treasurer's name and certification date are printed on the summary page.

Future dates, dates already certified and dates with open sessions can't be certified.

**Money that arrives after certifying**
A late M-Pesa or Pay Bill payment for a certified date is still receipted (the money was received), and the system's own automatic voids still apply. Both are recorded in the audit log so an admin can see that a certified statement changed.

**Need to change a certified date?**
Only an admin can unlock it, with a reason — see "Unlocking a certified statement". Certify it again when the correction is done.`,
};
