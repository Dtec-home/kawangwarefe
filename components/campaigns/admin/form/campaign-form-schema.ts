/**
 * Campaign form schema and mapping to/from the GraphQL contract
 * (Fundraising S1, ticket 1.10). Shared by create and edit.
 *
 * The backend re-validates everything (code uniqueness against campaign and
 * department codes, active department, target ≥ 1, end ≥ start).
 */

import { z } from "zod";

import type { Campaign, CampaignInput } from "@/lib/types/fundraising";

export const PAYBILL_CODE_PATTERN = /^[A-Z0-9]{2,10}$/;
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;
const YOUTUBE_PATTERN = /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//i;

export const GALLERY_KINDS = ["image", "youtube"] as const;
export const REMINDER_FREQUENCIES = ["none", "weekly", "monthly"] as const;

export type GalleryKind = (typeof GALLERY_KINDS)[number];
export type ReminderFrequency = (typeof REMINDER_FREQUENCIES)[number];

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Upper-cases a typed Pay Bill code and drops spaces. */
export function normalisePaybillCode(value: string): string {
  return value.toUpperCase().replace(/\s+/g, "");
}

const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || isHttpUrl(v), "Enter a full link starting with https://");

const wholeNumber = (label: string, max: number) =>
  z
    .number({ error: `Enter the ${label} as a number` })
    .int(`Enter the ${label} as a whole number`)
    .min(0, `The ${label} cannot be negative`)
    .max(max, `The ${label} can be at most ${max}`);

const galleryItemSchema = z
  .object({
    kind: z.enum(GALLERY_KINDS),
    url: z.string().trim().refine(isHttpUrl, "Enter a full link starting with https://"),
  })
  .refine((item) => item.kind !== "youtube" || YOUTUBE_PATTERN.test(item.url), {
    message: "Enter a YouTube link (youtube.com or youtu.be)",
    path: ["url"],
  });

export const campaignFormSchema = z
  .object({
    title: z.string().trim().min(3, "Give the campaign a title of at least 3 characters").max(200),
    categoryId: z.string().min(1, "Choose the department the money goes to"),
    purposeId: z.string(),
    targetAmount: z
      .string()
      .trim()
      .refine((v) => AMOUNT_PATTERN.test(v) && Number(v) >= 1, "Enter a target of at least KES 1"),
    paybillCode: z
      .string()
      .trim()
      .regex(PAYBILL_CODE_PATTERN, "Use 2 to 10 capital letters or digits, e.g. BUILD"),
    startDate: z.string(),
    endDate: z.string(),
    summary: z.string().trim(),
    story: z.string().trim(),
    coverImageUrl: optionalUrl,
    gallery: z.array(galleryItemSchema),
    isPublic: z.boolean(),
    allowPledges: z.boolean(),
    allowChampions: z.boolean(),
    reminderPolicy: z.object({
      frequency: z.enum(REMINDER_FREQUENCIES),
      daysBeforeDue: wholeNumber("days before the due date", 60),
      overdueNotices: wholeNumber("number of overdue notices", 10),
    }),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
    message: "The end date cannot be before the start date",
    path: ["endDate"],
  });

export type CampaignFormValues = z.infer<typeof campaignFormSchema>;

/** Decision 5: monthly, 3 days before the due date, 1 overdue notice. */
export const DEFAULT_REMINDER_POLICY: CampaignFormValues["reminderPolicy"] = {
  frequency: "monthly",
  daysBeforeDue: 3,
  overdueNotices: 1,
};

export const EMPTY_CAMPAIGN_FORM: CampaignFormValues = {
  title: "",
  categoryId: "",
  purposeId: "",
  targetAmount: "",
  paybillCode: "",
  startDate: "",
  endDate: "",
  summary: "",
  story: "",
  coverImageUrl: "",
  gallery: [],
  isPublic: true,
  allowPledges: true,
  allowChampions: false,
  reminderPolicy: DEFAULT_REMINDER_POLICY,
};

export function toCampaignInput(values: CampaignFormValues): CampaignInput {
  return {
    title: values.title.trim(),
    categoryId: values.categoryId,
    purposeId: values.purposeId || null,
    targetAmount: values.targetAmount.trim(),
    paybillCode: normalisePaybillCode(values.paybillCode),
    startDate: values.startDate || null,
    endDate: values.endDate || null,
    summary: values.summary.trim(),
    story: values.story.trim(),
    coverImageUrl: values.coverImageUrl.trim(),
    gallery: values.gallery.map(({ kind, url }) => ({ kind, url: url.trim() })),
    isPublic: values.isPublic,
    allowPledges: values.allowPledges,
    allowChampions: values.allowChampions,
    reminderPolicy: { ...values.reminderPolicy },
  };
}

function oneOf<T extends string>(allowed: readonly T[], value: string, fallback: T): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** Pre-fills the form for editing an existing campaign. */
export function campaignToFormValues(campaign: Campaign): CampaignFormValues {
  const policy = campaign.reminderPolicy;
  return {
    title: campaign.title,
    categoryId: campaign.categoryId,
    purposeId: campaign.purposeId ?? "",
    targetAmount: campaign.targetAmount,
    paybillCode: campaign.paybillCode,
    startDate: campaign.startDate ?? "",
    endDate: campaign.endDate ?? "",
    summary: campaign.summary,
    story: campaign.story,
    coverImageUrl: campaign.coverImageUrl,
    gallery: campaign.gallery.map((item) => ({
      kind: oneOf(GALLERY_KINDS, item.kind, "image"),
      url: item.url,
    })),
    isPublic: campaign.isPublic,
    allowPledges: campaign.allowPledges,
    allowChampions: campaign.allowChampions,
    reminderPolicy: {
      frequency: oneOf(REMINDER_FREQUENCIES, policy.frequency, DEFAULT_REMINDER_POLICY.frequency),
      daysBeforeDue: policy.daysBeforeDue,
      overdueNotices: policy.overdueNotices,
    },
  };
}
