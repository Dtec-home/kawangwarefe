import type { HelpArticle } from "../types";

export const ADMIN_GROUPS_ARTICLE: HelpArticle = {
  slug: "admin-groups",
  title: "Managing groups",
  category: "Members & Groups",
  roles: ["admin"],
  relatedRoute: "/admin/groups",
  relatedTourKey: "admin_groups_v1",
  body: `Groups (/admin/groups) organizes members into named groups (e.g. Youth, Complex A) without needing Django admin access. Groups are also what a department set to "Auto-match Member Group" (Admin → Categories) uses to route contributions automatically, and what the \`group_name\` column in member bulk import assigns members into.

**Creating a group**
Enter a name and click Create Group. Group names are matched case-insensitively elsewhere in the app (e.g. bulk import reuses an existing group instead of creating a near-duplicate).

**Managing a group**
- **Edit** (rename) or **Delete** the group.
- **Add Members** opens a search-and-select modal — search by name or phone, check the members you want, and add them all at once; members already in the group are skipped automatically and reported as such.
- **Info** opens a read-only list of everyone currently in the group, with an option to remove an individual member from the group.`,
};
