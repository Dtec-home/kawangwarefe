/**
 * Help Center content types.
 *
 * Each article lives in its own file under `./articles/` (one exported
 * `HelpArticle` constant per file) and is registered in `./index.ts`'s
 * `HELP_ARTICLES` array. See index.ts for the registration convention.
 */

/**
 * Audiences an article can be tagged for.
 * - `member`: every signed-in user.
 * - `recorder`: people who record physical giving at /record — the Recorder
 *   role, and staff (who also get the recorder workspace).
 * - `admin`: anyone who can open the admin panel (staff, department, group
 *   and content admins).
 */
export type HelpAudience = "member" | "recorder" | "admin";

export interface HelpArticle {
  /** Unique, URL-safe identifier, kebab-case (e.g. "making-a-contribution"). */
  slug: string;
  /** Short, human-readable title shown in search results and cards. */
  title: string;
  /** Grouping label used for the Help Center's category cards (e.g. "Giving", "Account"). */
  category: string;
  /** Which audiences can see this article. A plain member only ever sees 'member' articles; a recorder also sees 'recorder'; an admin also sees 'admin'. See `helpAudiencesFor`. */
  roles: HelpAudience[];
  /** Article body — plain text/markdown-ish prose, rendered as-is by the Help Center page. */
  body: string;
  /** Optional in-app route this article is about, e.g. "/contribute" — lets the Help Center link out to the relevant page. */
  relatedRoute?: string;
  /** Optional tutorialKey (from lib/tours/configs/*) this article's "Replay tour" action should trigger. */
  relatedTourKey?: string;
  /** Set by authors when the article's accuracy needs a follow-up check (e.g. copied from an older flow) — surfaced for editors, not shown to end users. */
  needsReview?: boolean;
}
