import type { HelpArticle } from "../types";

export const DEVOTIONALS_PAGE_ARTICLE: HelpArticle = {
  slug: "devotionals-page",
  title: "Reading daily devotionals",
  category: "Church Content",
  roles: ["member"],
  relatedRoute: "/devotionals",
  body: `The Devotionals page opens with a large featured card — this is today's daily reading, fetched automatically each day, with its scripture reference and author shown under the title.

Below the featured card is a grid of up to 5 more devotionals published by the church, each showing a short preview, its author, and the publish date. On any card, "Read more" opens the full text — split into readable paragraphs — in a popup dialog.

There's no search or filter here; the page always shows today's featured reading plus the most recent devotionals from the church, newest first. If no devotionals have been published yet, you'll see a "No devotionals available yet" message instead of an empty page.`,
};
