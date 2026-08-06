import type { HelpArticle } from "../types";

export const ADMIN_DEVOTIONALS_ARTICLE: HelpArticle = {
  slug: "admin-devotionals",
  title: "Managing devotionals",
  category: "Church Content",
  roles: ["admin"],
  relatedRoute: "/admin/devotionals",
  relatedTourKey: "admin_devotionals_v1",
  body: `Devotionals Management (/admin/devotionals) is where you write and publish the daily devotionals members see on the Devotionals page.

"New Devotional" opens a form for the title, author, an optional scripture reference, the content itself (supports Markdown), a publish date, and an optional featured image URL. You can also choose whether it's published immediately and whether it's marked as featured right from that form.

The stats row at the top shows your Total, Published, Featured, and Draft counts. Below that, Search filters by title, author, content, or scripture, and you can further narrow by publish status or featured flag.

Each devotional in the list shows Published/Draft and Featured badges, its author, scripture reference, and publish date. The three-dot menu on a devotional lets you Preview it (a read-only popup of the full content), Edit its details, toggle Featured or Published/Unpublished, or Delete it. Selecting several devotionals with the checkboxes reveals bulk actions — toggle featured, toggle published, or delete — for the whole selection at once.`,
};
