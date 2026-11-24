/**
 * WhatsApp totals-post settings (WA-3, E3/E8; contracts 04 §E).
 *
 * Shapes follow the live GraphQL schema (`fundraising/api/post_settings.py`).
 * Times are "HH:MM" in Nairobi; days are 0 (Monday) to 6 (Sunday).
 */

export type ScheduleKind = "interval" | "fixed_times" | "daily";

export const SCHEDULE_KINDS: readonly ScheduleKind[] = ["interval", "fixed_times", "daily"];

/** One block of a post's layout, as the server describes it. */
export interface PostBlock {
  block: string;
  enabled: boolean;
  label: string;
  description: string;
}

/** What one layout item sends back to the server. */
export interface PostBlockInput {
  block: string;
  enabled: boolean;
}

/** The settings the editor works on: every field has a value. */
export interface PostSettings {
  scheduleKind: ScheduleKind;
  intervalMinutes: number;
  windowStart: string;
  windowEnd: string;
  daysOfWeek: number[];
  fixedTimes: string[];
  /** null = no extra daily post. */
  finalPostTime: string | null;
  onlyWhenChanged: boolean;
  postWhenZero: boolean;
  layout: PostBlock[];
  introText: string;
  closingText: string;
}

/** `WhatsAppPostSettingsType`: the church default (and a campaign's `effective`). */
export interface ChurchPostSettings extends Omit<PostSettings, "scheduleKind"> {
  scheduleKind: string;
  churchWhatsappGroupId: string;
  availableBlocks: PostBlock[];
}

/** `CampaignPostSettingsType`: a campaign's override; null = the church value. */
export interface CampaignPostSettings {
  campaignId: string;
  useChurchDefault: boolean;
  scheduleKind: string | null;
  intervalMinutes: number | null;
  windowStart: string | null;
  windowEnd: string | null;
  daysOfWeek: number[] | null;
  fixedTimes: string[] | null;
  finalPostTime: string | null;
  noFinalPost: boolean;
  onlyWhenChanged: boolean | null;
  postWhenZero: boolean | null;
  layout: PostBlock[] | null;
  introText: string | null;
  closingText: string | null;
  effective: ChurchPostSettings;
}

/** `WhatsAppPostSettingsInput` (left out = keep; finalPostTime null = none). */
export interface ChurchPostSettingsInput {
  scheduleKind?: ScheduleKind;
  intervalMinutes?: number;
  windowStart?: string;
  windowEnd?: string;
  daysOfWeek?: number[];
  fixedTimes?: string[];
  finalPostTime?: string | null;
  onlyWhenChanged?: boolean;
  postWhenZero?: boolean;
  layout?: PostBlockInput[];
  introText?: string;
  closingText?: string;
  churchWhatsappGroupId?: string;
}

/** `CampaignPostSettingsInput` (left out = keep; null = use the church value). */
export interface CampaignPostSettingsInput {
  useChurchDefault?: boolean;
  scheduleKind?: ScheduleKind | null;
  intervalMinutes?: number | null;
  windowStart?: string | null;
  windowEnd?: string | null;
  daysOfWeek?: number[] | null;
  fixedTimes?: string[] | null;
  finalPostTime?: string | null;
  noFinalPost?: boolean;
  onlyWhenChanged?: boolean | null;
  postWhenZero?: boolean | null;
  layout?: PostBlockInput[] | null;
  introText?: string | null;
  closingText?: string | null;
}

/** The settings a campaign may override, one by one. */
export const SETTING_FIELDS = [
  "scheduleKind",
  "intervalMinutes",
  "windowStart",
  "windowEnd",
  "daysOfWeek",
  "fixedTimes",
  "finalPostTime",
  "onlyWhenChanged",
  "postWhenZero",
  "layout",
  "introText",
  "closingText",
] as const;

export type SettingField = (typeof SETTING_FIELDS)[number];

export interface WhatsAppGroup {
  id: string;
  name: string;
}
