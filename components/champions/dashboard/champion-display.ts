/**
 * Pure helpers for champion screens (Fundraising S5, lane S5-UI-J): status
 * labels, code and target validation, the Pay Bill line and the WhatsApp
 * message. Used by the member dashboard (5.9) and the staff Champions tab (5.10).
 */

import type {
  CampaignProgress,
  Champion,
  ChampionStatus,
  PaymentInstructions,
} from "@/lib/types/fundraising";
import type { StatusVariant } from "@/components/ui/status-badge";

export const CHAMPION_STATUS_LABELS: Record<ChampionStatus, string> = {
  PENDING: "Waiting for approval",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

export const CHAMPION_STATUS_VARIANTS: Record<ChampionStatus, StatusVariant> = {
  PENDING: "warning",
  ACTIVE: "success",
  INACTIVE: "neutral",
};

export function championStatusLabel(status: ChampionStatus): string {
  return CHAMPION_STATUS_LABELS[status] ?? status;
}

/** The model's rule: `^[A-Z0-9]{2,9}$`. */
const CODE_PATTERN = /^[A-Z0-9]{2,9}$/;

export const CHAMPION_CODE_HINT = "Use 2 to 9 capital letters or digits, for example JOHN or MAMA1";

/** What the member typed, as the code would be stored: capitals and digits only. */
export function normalizeChampionCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function championCodeError(code: string): string | null {
  return CODE_PATTERN.test(code) ? null : CHAMPION_CODE_HINT;
}

/** The personal target is optional; when given it is at least KES 1. */
export function personalTargetError(value: string): string | null {
  if (value.trim() === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 1 ? null : "A personal target must be at least KES 1";
}

export function championPaybillText(instructions: Pick<PaymentInstructions, "paybillNumber" | "accountReference">): string {
  return `Pay Bill ${instructions.paybillNumber}, Account ${instructions.accountReference}`;
}

type ShareableChampion = Pick<Champion, "campaignTitle" | "publicUrl" | "paymentInstructions">;

/** A ready-to-send message for friends and family. */
export function championWhatsappMessage(champion: ShareableChampion): string {
  return [
    `I'm raising money for ${champion.campaignTitle} at our church. Please support me!`,
    `Give online: ${champion.publicUrl}`,
    `Or by M-Pesa: ${championPaybillText(champion.paymentInstructions)}.`,
    "Thank you and God bless!",
  ].join("\n");
}

type TargetChampion = Pick<Champion, "raised" | "donorCount" | "personalTarget">;

/**
 * The champion's figures in the shape the shared CampaignProgress bar takes,
 * measured against their personal target; null when they set none.
 */
export function personalTargetProgress(champion: TargetChampion): CampaignProgress | null {
  const target = Number(champion.personalTarget ?? 0);
  if (!champion.personalTarget || !(target > 0)) return null;
  const raised = Number(champion.raised) || 0;
  return {
    target: champion.personalTarget,
    raised: champion.raised,
    remaining: Math.max(target - raised, 0).toFixed(2),
    percent: Math.round((raised / target) * 1000) / 10,
    donorCount: champion.donorCount,
    giftCount: 0,
    pledged: "0",
  };
}
