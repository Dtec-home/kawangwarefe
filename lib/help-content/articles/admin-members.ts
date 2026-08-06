import type { HelpArticle } from "../types";

export const ADMIN_MEMBERS_ARTICLE: HelpArticle = {
  slug: "admin-members",
  title: "Managing members",
  category: "Members & Groups",
  roles: ["admin"],
  relatedRoute: "/admin/members",
  relatedTourKey: "admin_members_v1",
  body: `Members (/admin/members) is the full member directory: search, edit, and manage every member's roles, groups, and status.

**Search & filter**
Search by name, phone number, or member number, and filter to Active Only or Inactive Only. Clear Filters resets both.

**Adding members**
"Add Member" opens a form for first name, last name, phone number, and optional email, plus optional roles and group checkboxes. Use "Import" to bulk-upload members from a CSV or Excel file instead (see the "Bulk-importing members" article).

**Each member row**
- **Edit** — update name, phone, and email inline.
- **Roles** (shield icon) — toggle admin, treasurer, pastor, content_admin, or member.
- **Groups** (people icon) — check/uncheck which groups the member belongs to.
- **Department numbers** (hash icon, only shown when at least one department tracks a member identifier) — set the member's number for departments like Welfare that track a per-member number. Enable this per department under Admin → Categories → edit → "Track a per-member number".
- **Activate/Deactivate** — toggles the member's active status; a confirmation dialog appears first.
- **Delete** — permanently removes the member; a confirmation dialog appears first, and this cannot be undone.
- **View contribution progress** (trending-up icon, desktop only) — jumps to that member's giving progress in Reports.

The list is paginated 100 members per page.`,
};
