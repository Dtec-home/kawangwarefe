import type { HelpArticle } from "../types";

export const ANNOUNCEMENTS_PAGE_ARTICLE: HelpArticle = {
  slug: "announcements-page",
  title: "Viewing announcements",
  category: "Church Content",
  roles: ["member"],
  relatedRoute: "/announcements",
  body: `The Announcements page lists current, active announcements from the church office as a grid of cards.

Each card shows the announcement's title, publish date, and a short preview of the content. A sparkle icon on a card marks a higher-priority announcement — those are also shown first, since the list is ordered by priority before date.

If an announcement's text is longer than a couple of lines, the card is truncated and a "Read more →" link appears at the bottom of the card. Clicking it opens the full announcement (title, full publish date and time, and complete text) in a popup dialog.

There's no search or filter on this page — it simply shows every announcement that's currently active and not yet expired, up to 50 at a time, newest and most important first. If nothing is currently posted, the page shows a "No announcements at this time" message instead of an empty grid.`,
};
