/**
 * Fundraising campaign help articles (Fundraising S6 slot, owned by lane S6-DOC-A).
 *
 * One file per article in this folder, listed here; `lib/help-content/index.ts`
 * spreads this list into HELP_ARTICLES, so the lane never edits the registry.
 */

import type { HelpArticle } from "../../types";
import { FUNDRAISING_APPROVE_CAMPAIGN_ARTICLE } from "./admin-approve-campaign";
import { FUNDRAISING_CAMPAIGN_STATEMENT_ARTICLE } from "./admin-campaign-statement";
import { FUNDRAISING_CLOSE_CAMPAIGN_ARTICLE } from "./admin-close-campaign";
import { FUNDRAISING_CREATE_CAMPAIGN_ARTICLE } from "./admin-create-campaign";
import { FUNDRAISING_MANAGE_CHAMPIONS_ARTICLE } from "./admin-manage-champions";
import { FUNDRAISING_PLEDGE_REGISTER_ARTICLE } from "./admin-pledge-register";
import { FUNDRAISING_POST_UPDATE_ARTICLE } from "./admin-post-update";
import { FUNDRAISING_WHATSAPP_LIST_ARTICLE } from "./admin-whatsapp-list";
import { FUNDRAISING_BECOME_CHAMPION_ARTICLE } from "./member-become-champion";
import { FUNDRAISING_GIVE_TO_CAMPAIGN_ARTICLE } from "./member-give-to-campaign";
import { FUNDRAISING_MY_PLEDGES_ARTICLE } from "./member-my-pledges";
import { FUNDRAISING_RECORDER_TAG_CAMPAIGN_ARTICLE } from "./recorder-tag-campaign";

export const FUNDRAISING_ARTICLES: HelpArticle[] = [
  // Staff and department admins
  FUNDRAISING_CREATE_CAMPAIGN_ARTICLE,
  FUNDRAISING_APPROVE_CAMPAIGN_ARTICLE,
  FUNDRAISING_WHATSAPP_LIST_ARTICLE,
  FUNDRAISING_POST_UPDATE_ARTICLE,
  FUNDRAISING_PLEDGE_REGISTER_ARTICLE,
  FUNDRAISING_CAMPAIGN_STATEMENT_ARTICLE,
  FUNDRAISING_CLOSE_CAMPAIGN_ARTICLE,
  FUNDRAISING_MANAGE_CHAMPIONS_ARTICLE,
  // Members
  FUNDRAISING_GIVE_TO_CAMPAIGN_ARTICLE,
  FUNDRAISING_MY_PLEDGES_ARTICLE,
  FUNDRAISING_BECOME_CHAMPION_ARTICLE,
  // Recorders
  FUNDRAISING_RECORDER_TAG_CAMPAIGN_ARTICLE,
];
