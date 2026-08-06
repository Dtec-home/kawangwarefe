import type { HelpArticle } from "../types";

export const ADMIN_ANNOUNCEMENTS_ARTICLE: HelpArticle = {
  slug: "admin-announcements",
  title: "Creating and managing announcements",
  category: "Content Management",
  roles: ["admin"],
  relatedRoute: "/admin/announcements",
  relatedTourKey: "admin_announcements_v1",
  body: `The Announcements management page lists every announcement with search, a status filter (Live, Active, Inactive, Scheduled, Expired), and Total/Active/Inactive/Scheduled/Expired/High Priority counts at the top.

Creating one requires a title and content; Publish Date and Expiry Date are both optional — a future publish date schedules it to appear automatically later, and leaving expiry empty keeps it up indefinitely. "Live" specifically means: active, its publish date has already passed, and it hasn't expired — an announcement can be Active but not yet Live if it's scheduled for the future.

Each announcement's card menu has Edit, Activate/Deactivate, and Delete. Drag the handle on a card (or use the up/down arrows as a keyboard-accessible fallback) to reorder the list — that order is what determines display order on the public site, separately from the Priority number, which you can raise or lower with its own arrows. Select multiple announcements with the checkboxes to bulk toggle active status or bulk delete. "Bulk Add" lets you create several announcements at once instead of one at a time.`,
};
