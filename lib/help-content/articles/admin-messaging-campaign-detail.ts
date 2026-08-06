import type { HelpArticle } from "../types";

export const ADMIN_MESSAGING_CAMPAIGN_DETAIL_ARTICLE: HelpArticle = {
  slug: "admin-messaging-campaign-detail",
  title: "Reading a campaign's delivery results",
  category: "Communication",
  roles: ["admin"],
  relatedRoute: "/admin/messaging",
  relatedTourKey: "admin_messaging_detail_v1",
  body: `Opening a campaign from the Messaging page's History tab takes you to its results page. This page is read-only — there's no resend, cancel, or delete action here, because by the time a campaign has recipients, sending has already started or finished.

The Progress card shows sent count, failed count, and total recipients, and refreshes automatically every few seconds while the campaign is still in flight.

The Recipients table lists every individual recipient's phone number, delivery status, the SMS provider's message ID (when available), and any error text for failures. If any recipients failed, the "Export failures (CSV)" button becomes available — it downloads just the failed phone numbers, their errors, and the message text that was meant for them, so you can follow up outside the system (for example, by calling those members directly).`,
};
