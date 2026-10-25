import type { HelpArticle } from "../types";

export const TREASURER_PERIOD_SUMMARY_ARTICLE: HelpArticle = {
  slug: "treasurer-period-summary",
  title: "Period summary: opening balance and remittances",
  category: "Treasury",
  roles: ["admin"],
  relatedRoute: "/admin/reports",
  body: `The "Period summary" section at the bottom of the Treasurer's Cash Statement card (Admin → Reports → Exports) shows the figures that go on the statement's summary page, for the period you chose above. Treasurers and admins can change them; pastors see them read-only.

**Local church funds**
Shows Balance brought forward, Received (local funds only), Total, Less payments (approved, disbursing or paid expenses from local funds) and Balance at end.

**Setting the local fund opening balance (once)**
Balance brought forward can only be worked out from a starting point. Click "Set local fund opening balance" (or Change next to the current one) and enter:
- Amount (KES) — the local church funds balance at the start of the as-of date. It may be negative if the fund was overdrawn.
- The as-of date — not in the future.
- An optional note.
From then on the system adds local receipts and subtracts local payments to carry the balance forward. Setting a new value adds a new record; the latest one applies, and every change is audit-logged. For a period that starts before the as-of date, balance brought forward is left blank.

**Recording remittances**
When trust money is sent to the conference, record it so the statement's "Fund Remitted" table is filled in. Under "Remittances for this period", click "Add remittance" and enter:
- Method — Cash, Bank slip, Cheque or Money/postal order.
- Amount (KES) and Reference (slip, cheque or order number).
- Remitted on — the date it was sent.
- Period from / Period to — the statement period the money covers.
- An optional note.
Remittances appear on every statement whose period overlaps theirs. Edit or delete a remittance from its row; all changes are audit-logged.

**Checking the totals**
"Total remitted" is shown per method and overall. The exported summary page compares it with the statement's trust fund total and prints a warning if they differ.`,
};
