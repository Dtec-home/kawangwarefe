import type { HelpArticle } from "../types";

export const ADMIN_EXPENSES_ARTICLE: HelpArticle = {
  slug: "admin-expenses",
  title: "Using the Expenses page",
  category: "Expenses",
  roles: ["admin"],
  relatedRoute: "/admin/expenses",
  relatedTourKey: "admin_expenses_v1",
  body: `The Expenses page (Admin → Expenses) lists money requested, approved, and paid out of church funds.

**Requesting an expense**
If you're staff or a department (category) admin, click "Request Expense" to open the request form: Fund, Amount (KES), Expense Date, Payee, Description, Payment Method, Reference Number, an optional Purpose, and an optional Attachment URL for a receipt/voucher link. There's also a Payout Channel section further down for choosing how the money should be paid out, with its own fields that appear depending on the channel you pick.

Staff members additionally see a "Record as already approved" checkbox for logging money that's already been spent, skipping the normal approval step.

**Status badges**
Each expense shows one status: Requested, Approved, Disbursing, Paid, or Voided. "Disbursing" shows a spinning icon and the page automatically refreshes every few seconds while any row is in that state, so you don't need to manually reload to see it update.

**Accountability trail**
Rows show who requested, approved, and/or paid the expense (and, if voided, the reason given), wherever that information is available.

**Row actions**
The buttons shown per row — Approve, Mark Paid, Disburse via KCB, Edit, Cancel, or Void — depend on your role and that request's current status; not every button appears on every row. Disburse via KCB opens a confirmation dialog summarising the amount, payee, fund, payout channel, and beneficiary details before sending anything — nothing is sent until you confirm.

**Editing and voiding**
Edit is only available on a still-Requested expense, and the fund it's charged to can't be changed. Void (staff) or Cancel (your own pending request) both require typing a reason before confirming.

**Filtering**
Use the Filters card to narrow the list by Fund, Status, or a From/To date range; Clear Filters resets them. The summary card above the filters totals the Approved + Paid amount for whatever's currently shown.

NEEDS VERIFICATION: the exact rules for who can approve, mark paid, or disburse a given expense are enforced by the backend and aren't fully described in the visible UI — the buttons that appear for you are the authoritative guide to what you're allowed to do on a given row.`,
};
