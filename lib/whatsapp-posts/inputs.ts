/**
 * Between the server's shapes and the editor's (WA-3).
 *
 * The editor always works on full `PostSettings`. The church screen sends them
 * all. A campaign sends the fields it changed and `null` for the rest, so those
 * keep following the church (`CampaignPostSettingsInput`: null = inherit); the
 * final post is switched off with `noFinalPost`.
 */

import { completeLayout, layoutInput } from "./layout";
import { SCHEDULE_KIND_LABELS, daysSummary, intervalPhrase, joinTimes } from "./schedule";
import {
  SCHEDULE_KINDS,
  SETTING_FIELDS,
  type CampaignPostSettings,
  type CampaignPostSettingsInput,
  type ChurchPostSettings,
  type ChurchPostSettingsInput,
  type PostSettings,
  type ScheduleKind,
  type SettingField,
} from "./types";

function kind(value: string | null | undefined): ScheduleKind {
  return (SCHEDULE_KINDS as readonly string[]).includes(value ?? "") ? (value as ScheduleKind) : "interval";
}

/** A server settings answer as editor values (every block listed). */
export function toSettings(s: ChurchPostSettings): PostSettings {
  return {
    scheduleKind: kind(s.scheduleKind),
    intervalMinutes: s.intervalMinutes,
    windowStart: s.windowStart,
    windowEnd: s.windowEnd,
    daysOfWeek: [...s.daysOfWeek],
    fixedTimes: [...s.fixedTimes],
    finalPostTime: s.finalPostTime ?? null,
    onlyWhenChanged: s.onlyWhenChanged,
    postWhenZero: s.postWhenZero,
    layout: completeLayout(s.layout, s.availableBlocks?.length ? s.availableBlocks : s.layout),
    introText: s.introText ?? "",
    closingText: s.closingText ?? "",
  };
}

function cleanTimes(times: string[]): string[] {
  return [...new Set(times.map((t) => t.trim()).filter(Boolean))].sort();
}

function fieldValues(s: PostSettings) {
  return {
    scheduleKind: s.scheduleKind,
    intervalMinutes: s.intervalMinutes,
    windowStart: s.windowStart,
    windowEnd: s.windowEnd,
    daysOfWeek: [...new Set(s.daysOfWeek)].sort((a, b) => a - b),
    fixedTimes: cleanTimes(s.fixedTimes),
    finalPostTime: s.finalPostTime,
    onlyWhenChanged: s.onlyWhenChanged,
    postWhenZero: s.postWhenZero,
    layout: layoutInput(s.layout),
    introText: s.introText,
    closingText: s.closingText,
  };
}

/** `updateWhatsappPostSettings` input: every field, plus the announcements group. */
export function toChurchInput(s: PostSettings, churchWhatsappGroupId: string): ChurchPostSettingsInput {
  return { ...fieldValues(s), churchWhatsappGroupId: churchWhatsappGroupId.trim() };
}

/**
 * Unsaved church settings for `previewTotalsPost`: the preview only takes a
 * campaign override, so the church screen sends every field as one.
 */
export function toFullOverrideInput(s: PostSettings): CampaignPostSettingsInput {
  return { useChurchDefault: false, ...fieldValues(s), noFinalPost: s.finalPostTime === null };
}

/** The fields a campaign's override sets (the final post counts when switched off). */
export function overriddenFields(o: CampaignPostSettings): SettingField[] {
  return SETTING_FIELDS.filter((field) => {
    if (field === "finalPostTime") return o.noFinalPost || o.finalPostTime !== null;
    return o[field] !== null && o[field] !== undefined;
  });
}

/** The editor's starting values: the override where set, the church value elsewhere. */
export function campaignDraft(o: CampaignPostSettings): PostSettings {
  const church = toSettings(o.effective);
  const available = o.effective.availableBlocks;
  return {
    scheduleKind: o.scheduleKind !== null ? kind(o.scheduleKind) : church.scheduleKind,
    intervalMinutes: o.intervalMinutes ?? church.intervalMinutes,
    windowStart: o.windowStart ?? church.windowStart,
    windowEnd: o.windowEnd ?? church.windowEnd,
    daysOfWeek: o.daysOfWeek ? [...o.daysOfWeek] : church.daysOfWeek,
    fixedTimes: o.fixedTimes ? [...o.fixedTimes] : church.fixedTimes,
    finalPostTime: o.noFinalPost ? null : (o.finalPostTime ?? church.finalPostTime),
    onlyWhenChanged: o.onlyWhenChanged ?? church.onlyWhenChanged,
    postWhenZero: o.postWhenZero ?? church.postWhenZero,
    layout: o.layout ? completeLayout(o.layout, available) : church.layout,
    introText: o.introText ?? church.introText,
    closingText: o.closingText ?? church.closingText,
  };
}

/**
 * The church values this screen knows: all of them when the campaign follows
 * the church (then `effective` is the church), else the inherited fields only.
 * `church` (the admin's own church settings, when loaded) fills in the rest.
 */
export function campaignBaseline(o: CampaignPostSettings, church?: PostSettings): Partial<PostSettings> {
  const effective = toSettings(o.effective);
  const known: Partial<PostSettings> = { ...(church ?? {}) };
  const overridden = o.useChurchDefault ? new Set<SettingField>() : new Set(overriddenFields(o));
  for (const field of SETTING_FIELDS) {
    if (!overridden.has(field)) (known as Record<string, unknown>)[field] = effective[field];
  }
  return known;
}

/** `updateCampaignPostSettings` / preview input for a campaign. */
export function toCampaignInput(
  s: PostSettings,
  overridden: ReadonlySet<SettingField>,
  useChurchDefault: boolean,
): CampaignPostSettingsInput {
  if (useChurchDefault) return { useChurchDefault: true };
  const values = fieldValues(s);
  const input: CampaignPostSettingsInput = { useChurchDefault: false };
  for (const field of SETTING_FIELDS) {
    (input as Record<string, unknown>)[field] = overridden.has(field) ? values[field] : null;
  }
  input.noFinalPost = overridden.has("finalPostTime") && s.finalPostTime === null;
  return input;
}

/** A setting's value in plain words, for "Church: …" hints. */
export function describeField(field: SettingField, s: Partial<PostSettings>): string {
  switch (field) {
    case "scheduleKind":
      return s.scheduleKind ? SCHEDULE_KIND_LABELS[s.scheduleKind] : "";
    case "intervalMinutes":
      return s.intervalMinutes ? intervalPhrase(s.intervalMinutes) : "";
    case "windowStart":
      return s.windowStart ?? "";
    case "windowEnd":
      return s.windowEnd ?? "";
    case "daysOfWeek":
      return daysSummary(s.daysOfWeek ?? []);
    case "fixedTimes":
      return s.fixedTimes?.length ? joinTimes(s.fixedTimes) : "none";
    case "finalPostTime":
      return s.finalPostTime ?? "no final post";
    case "onlyWhenChanged":
      return s.onlyWhenChanged ? "on" : "off";
    case "postWhenZero":
      return s.postWhenZero ? "on" : "off";
    case "layout": {
      const layout = s.layout ?? [];
      return `${layout.filter((b) => b.enabled).length} of ${layout.length} blocks on`;
    }
    case "introText":
    case "closingText": {
      const text = (s[field] ?? "").trim();
      if (!text) return "none";
      return `“${text.length > 40 ? `${text.slice(0, 40)}…` : text}”`;
    }
  }
}
