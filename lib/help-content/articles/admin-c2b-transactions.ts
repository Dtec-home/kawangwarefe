import type { HelpArticle } from "../types";

export const ADMIN_C2B_TRANSACTIONS_ARTICLE: HelpArticle = {
  slug: "admin-c2b-transactions",
  title: "Reviewing and resolving C2B (Pay Bill) transactions",
  category: "M-Pesa & Transactions",
  roles: ["admin"],
  relatedRoute: "/admin/c2b-transactions",
  relatedTourKey: "admin_c2b_transactions_v1",
  body: `The C2B Transactions page (Admin → C2B Transactions) lists M-Pesa Pay Bill payments — money paid using the paybill/till account reference directly, rather than through the app's own contribution flow.

**Status column**
Each transaction has one of four statuses:
- Received — the payment has come in from M-Pesa.
- Processed — it was automatically matched to a department and recorded.
- Unmatched — the account reference didn't match any department code and needs manual resolution.
- Failed — the transaction could not be processed.

**Stats cards**
Total Received, Processed, Unmatched, and Failed give a quick count/amount summary for all transactions (not filtered). A warning banner appears above the filters whenever there's at least one Unmatched transaction, with a "View Unmatched" shortcut that applies the Unmatched filter.

**Filters**
Use the Status dropdown to show All, Received, Processed, Unmatched, or Failed transactions; Clear resets it. Refresh (top right) re-pulls the latest transactions and stats.

**Resolving an unmatched transaction**
Click Resolve on any Unmatched row to open the resolution form. It shows the transaction's details (Trans ID, customer, phone, reference, amount, date) and an Allocations section where you assign the payment to one or more departments:
- Pick a Department for each allocation row.
- A Purpose field appears if the department is configured to use one — sometimes required, sometimes optional, depending on the department.
- Enter an Amount for each row; use "Add row" to split the payment across more than one department, and the trash icon to remove a row.

A budget bar at the bottom tracks Allocated vs. the transaction total and won't let you resolve until the allocated amounts match the transaction amount exactly (shown as "Exact match"; otherwise it tells you whether you're over or how much remains). Once it matches and every row has a department (and purpose, where required), Resolve Transaction becomes enabled.

NEEDS VERIFICATION: exactly how a transaction gets auto-matched to a department in the first place (the "processed"/matchMethod logic) isn't shown in the UI and isn't covered here.`,
};
