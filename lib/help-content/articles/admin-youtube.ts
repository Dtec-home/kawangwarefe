import type { HelpArticle } from "../types";

export const ADMIN_YOUTUBE_ARTICLE: HelpArticle = {
  slug: "admin-youtube",
  title: "Managing YouTube videos",
  category: "Church Content",
  roles: ["admin"],
  relatedRoute: "/admin/youtube",
  relatedTourKey: "admin_youtube_v1",
  body: `YouTube Videos Management (/admin/youtube) is where you curate the video library shown on the church's Sermons page.

There are two ways to add videos: "Add Video" adds one video manually by pasting its YouTube video ID (the part after "watch?v=" in a YouTube URL), with a category and optional featured flag. "Sync from YouTube" instead pulls in a batch at once — either from your whole channel or from a specific playlist ID — with a configurable max number of videos and a default category applied to everything synced.

Search filters by title or description. You can further filter by category (Sermon, Worship, Testimony, Teaching, Event, Other), by source (Manual Entry, YouTube Channel, or YouTube Playlist — showing how each video was added), or by featured status.

Each video card shows its thumbnail, duration, view and like counts, and category/source badges. "Preview" plays the video in an embedded player right on the page. The three-dot menu lets you Edit the title/description/category, toggle Featured, open the video on YouTube in a new tab, or Delete it. Selecting several videos with the checkboxes reveals bulk actions to toggle featured or delete the selection.`,
};
