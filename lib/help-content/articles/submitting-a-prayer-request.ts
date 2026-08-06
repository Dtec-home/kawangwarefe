import type { HelpArticle } from "../types";

export const SUBMITTING_A_PRAYER_REQUEST_ARTICLE: HelpArticle = {
  slug: "submitting-a-prayer-request",
  title: "Submitting a Prayer Request",
  category: "Prayer Requests",
  roles: ["member", "admin"],
  body: `From "Submit a Prayer Request" you can share a request with your pastors and prayer team.

Fill in a title (up to 120 characters) and details (up to 2000 characters), then choose who can see it:
- Prayer team only
- Just my pastor
- Public wall

You can also check "Submit anonymously" to hide your name from the team's view. Your request stays linked to your account behind the scenes so the church can follow up appropriately, even when submitted anonymously.

Every request you submit — along with its visibility and current status — appears in the "My Requests" list on the same page.`,
  relatedRoute: "/prayers/new",
  relatedTourKey: "prayers_new_v1",
};
