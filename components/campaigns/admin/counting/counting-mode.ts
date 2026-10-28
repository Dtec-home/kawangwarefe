/**
 * How a campaign counts money (ADR-0013, DEPARTMENT_CAMPAIGNS DC-4).
 *
 * TAGGED: only gifts given to the campaign (its code, a champion's code, or
 * picked at the desk). DEPARTMENT: every gift to its department, whichever
 * code or desk entry the giver used, including the department's past giving.
 * One wording for the form, the overview and the change dialogs.
 */

import type { CampaignCountingMode, CampaignStatus } from "@/lib/types/fundraising";

export const COUNTING_MODES = ["TAGGED", "DEPARTMENT"] as const satisfies readonly CampaignCountingMode[];

/** Statuses in which the counting mode is set on the form; afterwards it takes a second approver. */
const FORM_STATUSES: readonly CampaignStatus[] = ["DRAFT", "PENDING_APPROVAL"];

export function countingIsOnForm(status: CampaignStatus | null): boolean {
  return status === null || FORM_STATUSES.includes(status);
}

function department(name: string | null | undefined): string {
  return name?.trim() || "the department";
}

export function countingModeLabel(mode: CampaignCountingMode, departmentName?: string | null): string {
  return mode === "DEPARTMENT"
    ? `All ${department(departmentName)} giving`
    : "Gifts to this campaign only";
}

export function countingModeHint(mode: CampaignCountingMode, departmentName?: string | null): string {
  const name = department(departmentName);
  return mode === "DEPARTMENT"
    ? `Every gift to ${name} counts, whichever account code or desk entry the giver used, including ${name}'s past giving. Only one campaign per department can do this at a time.`
    : `Only gifts made with this campaign's code, a champion's code, or picked for it at the desk count. Other ${name} giving stays with the department.`;
}

/** For mid-sentence use: "Counts all Land Purchase giving" keeps the department's name. */
export function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** What approving a change will do, for the request and approval dialogs. */
export function countingChangeEffect(mode: CampaignCountingMode, departmentName?: string | null): string {
  const name = department(departmentName);
  return mode === "DEPARTMENT"
    ? `Once approved, every past and future ${name} gift is counted by this campaign, and those gifts clear the givers' open pledges. Nothing is posted to WhatsApp.`
    : `Once approved, new ${name} gifts stay with the department unless given to this campaign. Gifts already counted stay counted.`;
}
