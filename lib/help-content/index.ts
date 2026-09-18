import type { HelpArticle, HelpAudience } from "./types";

export type { HelpArticle, HelpAudience } from "./types";

import { ADMIN_ANNOUNCEMENTS_ARTICLE } from "./articles/admin-announcements";
import { ADMIN_ASSIGNING_RECORDER_ROLE_ARTICLE } from "./articles/admin-assigning-recorder-role";
import { ADMIN_C2B_TRANSACTIONS_ARTICLE } from "./articles/admin-c2b-transactions";
import { ADMIN_CATCH_UP_WINDOWS_ARTICLE } from "./articles/admin-catch-up-windows";
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
import { ADMIN_MEMBERS_ARTICLE } from "./articles/admin-members";
import { ADMIN_MEMBERS_IMPORT_ARTICLE } from "./articles/admin-members-import";
import { ADMIN_MESSAGING_ARTICLE } from "./articles/admin-messaging";
import { ADMIN_MESSAGING_CAMPAIGN_DETAIL_ARTICLE } from "./articles/admin-messaging-campaign-detail";
import { ADMIN_PRAYERS_ARTICLE } from "./articles/admin-prayers";
import { ADMIN_REPORTS_ARTICLE } from "./articles/admin-reports";
import { ADMIN_UNLOCKING_CERTIFIED_STATEMENT_ARTICLE } from "./articles/admin-unlocking-certified-statement";
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
import { RECORDER_COLLECTION_SESSIONS_ARTICLE } from "./articles/recorder-collection-sessions";
import { RECORDER_RECORDING_GIVING_ARTICLE } from "./articles/recorder-recording-giving";
import { RECORDER_REPRINT_RESEND_VOID_ARTICLE } from "./articles/recorder-reprint-resend-void";
import { SERMONS_PAGE_ARTICLE } from "./articles/sermons-page";
import { SUBMITTING_A_PRAYER_REQUEST_ARTICLE } from "./articles/submitting-a-prayer-request";
import { TREASURER_CASH_STATEMENT_EXPORT_ARTICLE } from "./articles/treasurer-cash-statement-export";
import { TREASURER_PERIOD_SUMMARY_ARTICLE } from "./articles/treasurer-period-summary";
import { TREASURER_RECEIPTS_AND_VOIDS_ARTICLE } from "./articles/treasurer-receipts-and-voids";
import { TREASURER_SESSIONS_AND_CERTIFICATION_ARTICLE } from "./articles/treasurer-sessions-and-certification";
import { TREASURER_STATEMENT_DEPARTMENTS_ARTICLE } from "./articles/treasurer-statement-departments";

/**
 * Registry of all Help Center articles.
 *
 * One file per article under `./articles/`, imported explicitly here (not a
 * runtime glob -- Next.js client bundling needs static imports). Add new
 * articles by creating a file under `./articles/` and adding it below.
 */
export const HELP_ARTICLES: HelpArticle[] = [
  ADMIN_ANNOUNCEMENTS_ARTICLE,
  ADMIN_ASSIGNING_RECORDER_ROLE_ARTICLE,
  ADMIN_C2B_TRANSACTIONS_ARTICLE,
  ADMIN_CATCH_UP_WINDOWS_ARTICLE,
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
  ADMIN_MEMBERS_ARTICLE,
  ADMIN_MEMBERS_IMPORT_ARTICLE,
  ADMIN_MESSAGING_ARTICLE,
  ADMIN_MESSAGING_CAMPAIGN_DETAIL_ARTICLE,
  ADMIN_PRAYERS_ARTICLE,
  ADMIN_REPORTS_ARTICLE,
  ADMIN_UNLOCKING_CERTIFIED_STATEMENT_ARTICLE,
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
  RECORDER_COLLECTION_SESSIONS_ARTICLE,
  RECORDER_RECORDING_GIVING_ARTICLE,
  RECORDER_REPRINT_RESEND_VOID_ARTICLE,
  SERMONS_PAGE_ARTICLE,
  SUBMITTING_A_PRAYER_REQUEST_ARTICLE,
  TREASURER_CASH_STATEMENT_EXPORT_ARTICLE,
  TREASURER_PERIOD_SUMMARY_ARTICLE,
  TREASURER_RECEIPTS_AND_VOIDS_ARTICLE,
  TREASURER_SESSIONS_AND_CERTIFICATION_ARTICLE,
  TREASURER_STATEMENT_DEPARTMENTS_ARTICLE,
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

/** What `helpAudiencesFor` needs to know about the current user (from `useUserRole`). */
export interface HelpViewer {
  /** Staff, department, group or content admin — can open the admin panel. */
  canAccessAdmin: boolean;
  /** Holds the Recorder role. */
  isRecorder: boolean;
  /** Admin, treasurer or pastor — staff also get the recorder workspace. */
  isStaff: boolean;
}

/**
 * The audiences a user may read. Everyone sees 'member' articles; recorders
 * and staff (who can also record giving at /record) see 'recorder' articles;
 * anyone who can open the admin panel sees 'admin' articles. A pure recorder
 * is not an admin, so treasury/admin articles stay hidden from them.
 */
export function helpAudiencesFor(viewer: HelpViewer): HelpAudience[] {
  const audiences: HelpAudience[] = ["member"];
  if (viewer.isRecorder || viewer.isStaff) audiences.push("recorder");
  if (viewer.canAccessAdmin) audiences.push("admin");
  return audiences;
}

/** Articles tagged for at least one of `audiences`. */
export function articlesForAudiences(
  audiences: HelpAudience[],
  articles: HelpArticle[] = HELP_ARTICLES
): HelpArticle[] {
  return articles.filter((article) => article.roles.some((role) => audiences.includes(role)));
}
