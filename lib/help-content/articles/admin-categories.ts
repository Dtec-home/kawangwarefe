import type { HelpArticle } from "../types";

export const ADMIN_CATEGORIES_ARTICLE: HelpArticle = {
  slug: "admin-categories",
  title: "Managing contribution departments",
  category: "Departments",
  roles: ["admin"],
  relatedRoute: "/admin/categories",
  relatedTourKey: "admin_categories_v1",
  body: `Contribution Departments (/admin/categories) are the top-level buckets contributions get routed into — Tithe, Offering, Building Fund, and so on.

**Creating a department**
Name and Code are required; Code auto-fills from the name (used as the M-Pesa account reference) but can be edited, up to 20 uppercase characters. Description is optional.

**Department Type (routing mode)**
- **Top-level Only** — a plain department members choose directly.
- **Auto-match Member Group** — a contribution is automatically routed based on the member's group. Pick "If member has no group" (fall back to Top-level, or reject the contribution) and which groups are eligible ("Allowed Groups for Auto Route").
- **Requires Purpose** — members must pick a purpose under this department; manage purposes via the "Purposes" button, which appears on departments configured this way.
- **Optional Details** — members may add free-text details, not required.

**Audience**
Restrict a department to All members, Adults only, or Children only.

**Per-member number tracking**
Switch on "Track a per-member number for this department" (e.g. a Welfare number) to add a Number label and an optional format (a regex, e.g. \`^[0-9]{1,6}$\`) — leave the format blank to accept any value. Once enabled, admins can set each member's number from the Members page, and it's carried on the M-Pesa reference and available as a column in the member import template.

**Fund Settings (expense tracking)**
"Fund Settings" on each department lets you switch on expense tracking and record an opening balance and date. Once enabled, a live Current Balance badge shows on the department; historical contributions aren't retroactively deducted.

**Managing existing departments**
Edit, Deactivate/Activate, or Delete a department from the list; each action is available from the row's buttons.`,
};
