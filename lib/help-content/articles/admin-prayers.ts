import type { HelpArticle } from "../types";

export const ADMIN_PRAYERS_ARTICLE: HelpArticle = {
  slug: "admin-prayers",
  title: "Reviewing and updating prayer requests",
  category: "Pastoral Care",
  roles: ["admin"],
  relatedRoute: "/admin/prayers",
  relatedTourKey: "admin_prayers_v1",
  body: `The Prayer Requests page lists every request submitted by members and visitors, with a status filter (Open, Praying, Answered, Archived, or All) at the top.

Each request shows its title, full text, and who submitted it — unless it was submitted anonymously, in which case the requester's name is deliberately withheld and shown as "Anonymous" instead. The line under the title also shows the request's visibility (private, prayer team, or public) and when it was submitted.

Use the "Mark praying" / "Mark answered" / "Mark archived" buttons under each request to move it through its lifecycle as your prayer team follows up. There's no delete action on this page — requests move through statuses rather than being removed.`,
};
