import type { HelpArticle } from "../types";

export const ADMIN_CONTRIBUTIONS_ARTICLE: HelpArticle = {
  slug: "admin-contributions",
  title: "Viewing and managing contributions",
  category: "Contributions",
  roles: ["admin"],
  relatedRoute: "/admin/contributions",
  relatedTourKey: "admin_contributions_v1",
  body: `The Contributions page (Admin → Contributions) lists every contribution recorded in the system — M-Pesa till payments, manual entries (envelope, cash, or manual), and Pay Bill (C2B) transactions once they've been resolved to a department.

**Summary cards**
If you have staff (admin/treasurer) access, four cards at the top show Total Amount, Completed, Pending, and Failed — both a KES total and a count — for whatever the current filters match.

**Filters**
Use the Filters card to narrow the list:
- Search — matches phone number, member name, or receipt number.
- Status — All, Completed, Pending, or Failed.
- Department and Purpose — Purpose only becomes selectable once a department is chosen.
- From / To (date & time) — restrict to a date-time range.
- Page Size — 10, 20, or 50 rows per page.

Click Clear Filters to reset everything back to defaults. On mobile, tap Show/Hide to expand or collapse the filter panel.

If you're a group admin (and not staff or a department/category admin), you instead see a "My Group" selector scoped to the groups you administer, and the summary cards are hidden.

**The contributions list**
Each row shows the date, member (with member number if known), phone number, department, purpose, group, amount, status, M-Pesa receipt number, and — if the department tracks per-member identifiers — a "Dept. Member #" column.

A single contribution that was automatically split across multiple departments (from one M-Pesa prompt) is shown as one grouped row with the combined total; click it to expand and see each split line's department/purpose and amount.

**Book Receipt #**
This column is separate from the M-Pesa receipt number — it's for recording the church's own physical receipt book number, so you can cross-check the system against paper records. Click the pencil icon on any row to add or update it; a receipt number is required to save.

**Recording a new contribution**
Click Manual Entry (top right) to open the Manual Contribution Entry form for envelope, cash, or other manual contributions — see the "Recording a manual contribution" article for details.

**Pagination**
Use Previous / Next at the bottom of the table to move between pages; "Page X of Y" shows your position.`,
};
