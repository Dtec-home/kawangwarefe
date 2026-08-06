import type { HelpArticle } from "../types";

export const ADMIN_CATEGORY_ADMINS_ARTICLE: HelpArticle = {
  slug: "admin-category-admins",
  title: "Assigning department admins",
  category: "Members & Groups",
  roles: ["admin"],
  relatedRoute: "/admin/category-admins",
  relatedTourKey: "admin_category_admins_v1",
  body: `Department Admins (/admin/category-admins) grants a member admin privileges scoped to one contribution department only — for example, a Building Fund treasurer who shouldn't see or manage every other department.

**Assigning an admin**
Search for the member (by name or phone), select them, pick the department from "Select Department", then click Assign Admin.

**Viewing and filtering assignments**
Use "Filter by Department" to narrow the list to one department, or leave it on "All Departments" to see everyone. Assignments are grouped by department, showing each admin's name, phone, member number, who assigned them, and when.

**Removing an admin**
Click the trash icon on an assignment row; you'll be asked to confirm before the department-admin role is removed. This only removes their access to that specific department — it doesn't affect any other roles they hold.`,
};
