import type { HelpArticle } from "../types";

export const ADMIN_LEADERS_ARTICLE: HelpArticle = {
  slug: "admin-leaders",
  title: "Managing leaders shown on the public About page",
  category: "Content Management",
  roles: ["admin"],
  relatedRoute: "/admin/leaders",
  relatedTourKey: "admin_leaders_v1",
  body: `The Leaders & About page controls the leadership profiles shown on the public About page and home page.

Click "Add Leader" to create a profile: name and title/role are required; bio, photo URL, email, phone, and an optional linked department are all optional. Each existing leader's row lets you Edit its details, Activate/Deactivate it, or Delete it — deactivating hides a profile from the public site without losing its data, which is the safer option if someone is just stepping away temporarily.

Order matters here: drag the handle on the left of a row (or use the row's controls) to reorder the list, and that exact order is what visitors see on the public site. The Total / Active / Inactive counts at the top track how many profiles are currently published versus hidden.`,
};
