import type { HelpArticle } from "./types";

export type { HelpArticle } from "./types";

import { ADMIN_ANNOUNCEMENTS_ARTICLE } from "./articles/admin-announcements";
import { ADMIN_C2B_TRANSACTIONS_ARTICLE } from "./articles/admin-c2b-transactions";
import { ADMIN_CATEGORIES_ARTICLE } from "./articles/admin-categories";
import { ADMIN_CATEGORY_ADMINS_ARTICLE } from "./articles/admin-category-admins";
import { ADMIN_CATEGORY_PURPOSES_ARTICLE } from "./articles/admin-category-purposes";
import { ADMIN_CONTENT_HUB_ARTICLE } from "./articles/admin-content-hub";
import { ADMIN_CONTRIBUTIONS_ARTICLE } from "./articles/admin-contributions";
import { ADMIN_DEVOTIONALS_ARTICLE } from "./articles/admin-devotionals";
import { ADMIN_EVENTS_ARTICLE } from "./articles/admin-events";
import { ADMIN_EXPENSES_ARTICLE } from "./articles/admin-expenses";
import { ADMIN_GROUPS_ARTICLE } from "./articles/admin-groups";
import { ADMIN_LEADERS_ARTICLE } from "./articles/admin-leaders";
import { ADMIN_MANUAL_ENTRY_ARTICLE } from "./articles/admin-manual-entry";
import { ADMIN_MEMBERS_IMPORT_ARTICLE } from "./articles/admin-members-import";
import { ADMIN_MEMBERS_ARTICLE } from "./articles/admin-members";
import { ADMIN_MESSAGING_CAMPAIGN_DETAIL_ARTICLE } from "./articles/admin-messaging-campaign-detail";
import { ADMIN_MESSAGING_ARTICLE } from "./articles/admin-messaging";
import { ADMIN_PRAYERS_ARTICLE } from "./articles/admin-prayers";
import { ADMIN_RECEIPT_SETTINGS_ARTICLE } from "./articles/admin-receipt-settings";
import { ADMIN_REPORTS_ARTICLE } from "./articles/admin-reports";
import { ADMIN_YOUTUBE_ARTICLE } from "./articles/admin-youtube";
import { ANNOUNCEMENTS_PAGE_ARTICLE } from "./articles/announcements-page";
import { DEPARTMENT_MEMBER_IDENTIFIERS_ARTICLE } from "./articles/department-member-identifiers";
import { DEVOTIONALS_PAGE_ARTICLE } from "./articles/devotionals-page";
import { EVENTS_PAGE_ARTICLE } from "./articles/events-page";
import { GIVING_TO_MULTIPLE_DEPARTMENTS_ARTICLE } from "./articles/giving-to-multiple-departments";
import { MANAGING_FAMILY_MEMBERS_ARTICLE } from "./articles/managing-family-members";
import { MANAGING_YOUR_PROFILE_ARTICLE } from "./articles/managing-your-profile";
import { MULTI_DEPARTMENT_GIVING_ARTICLE } from "./articles/multi-department-giving";
import { NOTIFICATION_PREFERENCES_ARTICLE } from "./articles/notification-preferences";
import { RECEIPTS_AND_SMS_NOTIFICATIONS_ARTICLE } from "./articles/receipts-and-sms-notifications";
import { SERMONS_PAGE_ARTICLE } from "./articles/sermons-page";
import { SUBMITTING_A_PRAYER_REQUEST_ARTICLE } from "./articles/submitting-a-prayer-request";

/**
 * Registry of all Help Center articles.
 *
 * One file per article under `./articles/`, imported explicitly here (not a
 * runtime glob -- Next.js client bundling needs static imports). Add new
 * articles by creating a file under `./articles/` and adding it below.
 */
export const HELP_ARTICLES: HelpArticle[] = [
  ADMIN_ANNOUNCEMENTS_ARTICLE,
  ADMIN_C2B_TRANSACTIONS_ARTICLE,
  ADMIN_CATEGORIES_ARTICLE,
  ADMIN_CATEGORY_ADMINS_ARTICLE,
  ADMIN_CATEGORY_PURPOSES_ARTICLE,
  ADMIN_CONTENT_HUB_ARTICLE,
  ADMIN_CONTRIBUTIONS_ARTICLE,
  ADMIN_DEVOTIONALS_ARTICLE,
  ADMIN_EVENTS_ARTICLE,
  ADMIN_EXPENSES_ARTICLE,
  ADMIN_GROUPS_ARTICLE,
  ADMIN_LEADERS_ARTICLE,
  ADMIN_MANUAL_ENTRY_ARTICLE,
  ADMIN_MEMBERS_IMPORT_ARTICLE,
  ADMIN_MEMBERS_ARTICLE,
  ADMIN_MESSAGING_CAMPAIGN_DETAIL_ARTICLE,
  ADMIN_MESSAGING_ARTICLE,
  ADMIN_PRAYERS_ARTICLE,
  ADMIN_RECEIPT_SETTINGS_ARTICLE,
  ADMIN_REPORTS_ARTICLE,
  ADMIN_YOUTUBE_ARTICLE,
  ANNOUNCEMENTS_PAGE_ARTICLE,
  DEPARTMENT_MEMBER_IDENTIFIERS_ARTICLE,
  DEVOTIONALS_PAGE_ARTICLE,
  EVENTS_PAGE_ARTICLE,
  GIVING_TO_MULTIPLE_DEPARTMENTS_ARTICLE,
  MANAGING_FAMILY_MEMBERS_ARTICLE,
  MANAGING_YOUR_PROFILE_ARTICLE,
  MULTI_DEPARTMENT_GIVING_ARTICLE,
  NOTIFICATION_PREFERENCES_ARTICLE,
  RECEIPTS_AND_SMS_NOTIFICATIONS_ARTICLE,
  SERMONS_PAGE_ARTICLE,
  SUBMITTING_A_PRAYER_REQUEST_ARTICLE,
];

/**
 * Case-insensitive substring search over an article list's title and body.
 * Pure function so it's trivially unit-testable and reusable outside the
 * Help Center page (e.g. an admin search box) without re-querying anything.
 */
export function searchArticles(query: string, articles: HelpArticle[]): HelpArticle[] {
  const q = query.trim().toLowerCase();
  if (!q) return articles;
  return articles.filter(
    (article) =>
      article.title.toLowerCase().includes(q) || article.body.toLowerCase().includes(q)
  );
}
