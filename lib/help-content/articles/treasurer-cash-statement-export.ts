import type { HelpArticle } from "../types";

export const TREASURER_CASH_STATEMENT_EXPORT_ARTICLE: HelpArticle = {
  slug: "treasurer-cash-statement-export",
  title: "Exporting the Treasurer's Cash Statement",
  category: "Treasury",
  roles: ["admin"],
  relatedRoute: "/admin/reports",
  body: `The Treasurer's Cash Statement (Trust Fund) is produced from the system in the same layout as the paper sheet sent to the conference. Find it on Admin → Reports → Exports, in the "Treasurer's Cash Statement" card. Staff (admin, treasurer, pastor) can export it; recorders cannot.

**1. Choose the period**
- Single date — defaults to the most recent Sabbath.
- Date range — From and To.

**2. Choose Format and Paper**
Excel or PDF, on Letter (default) or A4 paper.

**3. Generate Cash Statement**
The file downloads, named like Cash_Statement_2026-08-29.pdf or Cash_Statement_2026-08-01_to_2026-08-31.xlsx.

**What's in it**
- One section per date that has receipts. A date range gives one section per day (in Excel, one sheet per day), then one summary page for the whole range.
- One row per receipt: NAME, RECEIPT No., RECEIPT TOTAL, then an amount under each department column. Trust columns come first, then local columns (see "Setting up departments for the Cash Statement").
- A TOTAL row on each page and a GRAND TOTAL at the end of each section.
- M-Pesa gifts are included as rows under their receipt number, but M-Pesa codes, phone numbers, notes and old book numbers are never printed.
- Voided receipts are left out.

**The summary page**
Trust Funds Remitted (one line per trust column), Fund Remitted by method (from the remittances you record), the Statement of Local Church Funds (balance brought forward, received, less payments, balance at end, cash in hand from confirmed collection sessions) and the signature blocks. The treasurer's name and date are filled in when every date in the period is certified. If the remitted total doesn't match the trust total, a warning line is printed.

**Before you export**
Use "Preview columns" to check the column order, open "Period summary" to set the opening balance and record remittances, and certify the date once the cash has been counted and confirmed.`,
};
