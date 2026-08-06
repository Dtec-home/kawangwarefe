import type { HelpArticle } from "../types";

export const SERMONS_PAGE_ARTICLE: HelpArticle = {
  slug: "sermons-page",
  title: "Watching sermons and videos",
  category: "Church Content",
  roles: ["member"],
  relatedRoute: "/sermons",
  body: `The Sermons page ("Watch & Listen") shows the most recent video first as a large embedded player you can play right on the page, with its category and description underneath.

Below the featured video is a grid of up to 4 more recent videos, each shown as a thumbnail with its title and category. Clicking a thumbnail opens that video on YouTube in a new tab.

There's no search or filter on this page — it always shows the most recently published videos. Use the "View All Videos" button at the bottom of the page to open the church's full YouTube channel for the complete archive. If no videos have been published yet, you'll see a "No videos available yet" message instead.`,
};
