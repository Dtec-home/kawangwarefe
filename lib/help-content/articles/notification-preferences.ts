import type { HelpArticle } from "../types";

export const NOTIFICATION_PREFERENCES_ARTICLE: HelpArticle = {
  slug: "notification-preferences",
  title: "Choosing Your Notification Preferences",
  category: "Account & Profile",
  roles: ["member", "admin"],
  body: `The Notifications page (My Profile → "Notifications") lets you choose which updates you'd like to receive:

- Announcements — church-wide news and important notices.
- Events — upcoming services, meetings, and gatherings.
- Devotionals — daily devotionals and scripture readings.
- Contribution reminders — gentle reminders about your giving.

Every channel is switched on by default. Toggle any of them off and press "Save preferences" to apply your choice. These preferences are saved on this device, so they may need to be set again if you sign in on another device or browser.`,
  relatedRoute: "/profile/notifications",
  relatedTourKey: "profile_notifications_v1",
};
