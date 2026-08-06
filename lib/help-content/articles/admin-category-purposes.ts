import type { HelpArticle } from "../types";

export const ADMIN_CATEGORY_PURPOSES_ARTICLE: HelpArticle = {
  slug: "admin-category-purposes",
  title: "Department purposes and auto-split allocations",
  category: "Departments",
  roles: ["admin"],
  relatedRoute: "/admin/categories",
  relatedTourKey: "admin_category_purposes_v1",
  body: `Department Purposes (Admin → Categories → Purposes, on a department set to "Requires Purpose") lets a single department break down giving further — e.g. Camp Meeting, Choir Uniforms, or Youth Camp under Building Fund.

**Adding a purpose**
Give it a Name; a Code is auto-generated from the name (uppercase, non-alphanumeric characters collapsed to dashes) unless you type your own. Description is optional.

**Managing purposes**
Each purpose can be edited, deactivated/activated, or deleted from the list. Deactivated purposes stay visible here but are excluded from the auto-split allocation dropdown and from being offered to members.

**Auto-Split Allocations**
This section only appears once at least one purpose exists. It lets you set a fixed percentage split so every contribution made directly to the department (without the member picking a purpose) is automatically divided across purposes — no manual selection required.

- Add an allocation by picking a purpose and a percentage (0.01–100).
- A running total badge shows whether allocations sum to exactly 100%, are under, or exceed it.
- **Auto-split only activates once at least 2 active allocations sum to exactly 100%** — the status badge confirms whether it's currently ON or OFF.
- Edit a percentage, or deactivate/remove an allocation, from its row. A purpose that already has an allocation is removed from the "add new" dropdown until you delete that allocation.`,
};
