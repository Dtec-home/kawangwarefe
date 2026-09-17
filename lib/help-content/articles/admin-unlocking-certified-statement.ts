import type { HelpArticle } from "../types";

export const ADMIN_UNLOCKING_CERTIFIED_STATEMENT_ARTICLE: HelpArticle = {
  slug: "admin-unlocking-certified-statement",
  title: "Unlocking a certified statement",
  category: "Treasury administration",
  roles: ["admin"],
  relatedRoute: "/admin/reports",
  body: `When the treasurer certifies the Cash Statement for a date, that date is locked: no new manual or recorder entries, no voids, no void requests and no catch-up window for it. If a real correction is needed afterwards — a gift was missed, or a receipt must be voided — an admin unlocks the statement.

**How to unlock (admins only)**
1. Go to Admin → Reports → Exports.
2. In the Treasurer's Cash Statement card, choose Single date and pick the certified date.
3. Click Unlock.
4. Enter a reason of at least 10 characters (e.g. "Envelope gift missed on the day, found during count") and click "Unlock statement".

The date then shows "Not certified (unlocked)"; hover over it to see who unlocked it, when and why. The unlock and its reason are kept in the audit log.

**After unlocking**
- Voids and void requests for that date work again.
- To record gifts for a past date, also open a catch-up window for it (see "Catch-up windows for past dates").
- When the correction is done, ask the treasurer to certify the statement again. Re-export the statement if one was already sent to the conference, and tell the conference about the change.

**Be careful**
Unlocking changes a statement that may already have gone to the conference. Unlock only for a clear reason, and certify again as soon as possible.`,
};
