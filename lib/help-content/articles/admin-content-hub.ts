import type { HelpArticle } from "../types";

export const ADMIN_CONTENT_HUB_ARTICLE: HelpArticle = {
  slug: "admin-content-hub",
  title: "Managing church content from the Content Hub",
  category: "Content Management",
  roles: ["admin"],
  relatedRoute: "/admin/content",
  relatedTourKey: "admin_content_v1",
  body: `The Church Content page is a launchpad, not an editor — it doesn't create or list anything itself. It's four cards, each linking to its own management page:

- Announcements — notices shown to members, with visibility, priority, and scheduling controls.
- Devotionals — daily or weekly devotional readings.
- Events — church events with dates, locations, and details.
- YouTube Videos — sermon recordings and church videos, synced from YouTube.

Click any card to open that section's full management page. This hub page itself requires content-admin access; each linked page may have its own permission checks once you're in it.`,
};
