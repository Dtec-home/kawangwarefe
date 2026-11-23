/**
 * Mocked-GraphQL fake for the WhatsApp posts screens (WA-3, WA-2 web).
 *
 * `fakeWhatsAppPosts(page, { persona })` signs a fake user in (injectSession,
 * without its built-in role mock) and answers every GraphQL request from a
 * small stateful fake: the church settings, one campaign's override, the
 * gateway's groups, a preview rendered from the sent layout, the test post
 * (refused within 10 minutes) and the member's tagging switch. Only the Next
 * dev server is needed.
 */

import type { Page } from "@playwright/test";
import { injectSession } from "./auth";

export type WaPersona = "admin" | "treasurer" | "member" | "recorder";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "POST, OPTIONS",
};

function roleFor(persona: WaPersona) {
  const staff = persona === "admin" || persona === "treasurer";
  return {
    __typename: "UserRoleInfo",
    isAuthenticated: true,
    isStaff: staff,
    isCategoryAdmin: false,
    isGroupAdmin: false,
    isContentAdmin: false,
    canSendBulkMessage: staff,
    isRecorder: persona === "recorder",
    canVoidReceipts: staff,
    isAdmin: persona === "admin",
    isTreasurer: persona === "treasurer",
    adminCategoryIds: [],
    ledDepartmentIds: [],
    adminGroupNames: [],
    adminCategories: [],
  };
}

const BLOCKS: Array<[string, string, string]> = [
  ["header", "Campaign name", "📢 and the campaign title"],
  ["intro", "Intro text", "Your own opening words"],
  ["date_line", "Date and time", "Today's date and the time of the post"],
  ["today_amount", "Today's total", "Money given today and by how many givers"],
  ["late_recorded", "Recorded late", "Money recorded today for earlier days"],
  ["raised_so_far", "Raised so far", "The campaign total and % of the target"],
  ["pledged", "Pledged", "Money pledged"],
  ["given_today", "Who gave today", "Each giver today and how much"],
  ["given_earlier_days", "Recorded for earlier days", "Givers recorded today for earlier days"],
  ["thank_you", "Thank-you line", "🙏 Thank you, tagging today's givers"],
  ["closing", "Closing text", "Your own closing words"],
  ["give_footer", "How to give", "Pay Bill, account and the campaign page"],
];
const SPEC = new Map(BLOCKS.map(([block, label, description]) => [block, { label, description }]));

type LayoutItem = { block: string; enabled: boolean };

const block = ({ block: key, enabled }: LayoutItem) => ({
  __typename: "WhatsAppPostBlock",
  block: key,
  enabled,
  label: SPEC.get(key)?.label ?? key,
  description: SPEC.get(key)?.description ?? "",
});

export interface ChurchState {
  scheduleKind: string;
  intervalMinutes: number;
  windowStart: string;
  windowEnd: string;
  daysOfWeek: number[];
  fixedTimes: string[];
  finalPostTime: string | null;
  onlyWhenChanged: boolean;
  postWhenZero: boolean;
  layout: LayoutItem[];
  introText: string;
  closingText: string;
  churchWhatsappGroupId: string;
}

type Override = Partial<Record<keyof ChurchState, unknown>> & { useChurchDefault: boolean; noFinalPost: boolean };

export interface FakeState {
  persona: WaPersona;
  church: ChurchState;
  override: Override;
  mentions: boolean;
  tagging: boolean;
  groupsFailures: number;
  tests: number;
  calls: Array<{ op: string; variables: Record<string, unknown> }>;
}

export interface FakeOptions {
  persona: WaPersona;
  /** The gateway fails this many `whatsappGroups` calls first. */
  groupsFailures?: number;
}

const OVERRIDABLE = [
  "scheduleKind", "intervalMinutes", "windowStart", "windowEnd", "daysOfWeek", "fixedTimes",
  "finalPostTime", "onlyWhenChanged", "postWhenZero", "layout", "introText", "closingText",
] as const;

function settingsType(s: ChurchState) {
  return {
    __typename: "WhatsAppPostSettingsType",
    ...s,
    layout: s.layout.map(block),
    availableBlocks: BLOCKS.map(([key]) => block({ block: key, enabled: false })),
  };
}

function effective(state: FakeState, override: Override = state.override): ChurchState {
  if (override.useChurchDefault) return state.church;
  const merged = { ...state.church } as Record<string, unknown>;
  for (const field of OVERRIDABLE) if (override[field] !== null && override[field] !== undefined) merged[field] = override[field];
  if (override.noFinalPost) merged.finalPostTime = null;
  return merged as unknown as ChurchState;
}

function overrideType(state: FakeState) {
  const o = state.override;
  const value = (field: (typeof OVERRIDABLE)[number]) => (o[field] === undefined ? null : o[field]);
  return {
    __typename: "CampaignPostSettingsType",
    campaignId: "9",
    useChurchDefault: o.useChurchDefault,
    ...Object.fromEntries(OVERRIDABLE.map((f) => [f, value(f)])),
    layout: o.layout ? (o.layout as LayoutItem[]).map(block) : null,
    noFinalPost: o.noFinalPost,
    effective: settingsType({ ...effective(state), churchWhatsappGroupId: "" }),
  };
}

/** A small stand-in for the server's renderer: the enabled blocks, in order. */
function render(s: ChurchState, mentions: boolean): string {
  const lines: Record<string, string> = {
    header: "*📢 Church Building*",
    intro: s.introText,
    date_line: "Mon 23 Nov 2026, 10:00",
    today_amount: "Today: KES 5,000 from 3 givers",
    raised_so_far: "Raised so far: KES 250,000 (25%)",
    given_today: "1. Kamau N. – KES 2,000",
    thank_you: mentions ? "🙏 Thank you @Kamau!" : "🙏 Thank you Kamau N.!",
    closing: s.closingText,
    give_footer: "Pay Bill 247247, Account BUILD",
  };
  return s.layout
    .filter((b) => b.enabled && lines[b.block])
    .map((b) => lines[b.block])
    .join("\n\n");
}

function campaignType(state: FakeState) {
  return {
    __typename: "CampaignType",
    id: "9",
    title: "Church Building",
    slug: "church-building",
    summary: "A new sanctuary.",
    story: "",
    coverImageUrl: "",
    gallery: [],
    categoryId: "3",
    categoryName: "Building Fund",
    purposeId: null,
    purposeName: null,
    targetAmount: "1000000.00",
    startDate: "2026-11-01",
    endDate: "2026-12-31",
    paybillCode: "BUILD",
    whatsappGroupId: "120363001@g.us",
    dailyTotalEnabled: true,
    dailyTotalPostWhenZero: false,
    whatsappMentionsEnabled: state.mentions,
    status: "ACTIVE",
    isPublic: true,
    allowPledges: true,
    allowChampions: false,
    reminderPolicy: { __typename: "ReminderPolicyType", frequency: "monthly", daysBeforeDue: 3, overdueNotices: 1 },
    createdByName: "Grace Admin",
    approvedByName: "Pastor John",
    approvedAt: "2026-11-01T07:00:00Z",
    closedAt: null,
    createdAt: "2026-10-20T07:00:00Z",
    publicUrl: "https://church.example/campaigns/church-building",
    paymentInstructions: { __typename: "PaymentInstructionsType", paybillNumber: "247247", accountReference: "BUILD", text: "Pay Bill 247247, Account BUILD" },
    progress: {
      __typename: "CampaignProgressType", target: "1000000.00", raised: "250000.00", remaining: "750000.00",
      percent: 25, donorCount: 12, giftCount: 15, pledged: "0.00",
    },
    canApprove: false,
    countingMode: "TAGGED",
    requestedCountingMode: null,
    countingModeRequestedBy: null,
    canApproveCountingMode: false,
    lastLeaderboardPost: null,
  };
}

export async function fakeWhatsAppPosts(page: Page, options: FakeOptions): Promise<FakeState> {
  const state: FakeState = {
    persona: options.persona,
    church: {
      scheduleKind: "interval",
      intervalMinutes: 60,
      windowStart: "08:00",
      windowEnd: "20:00",
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      fixedTimes: [],
      finalPostTime: "23:50",
      onlyWhenChanged: true,
      postWhenZero: false,
      layout: BLOCKS.map(([key]) => ({ block: key, enabled: key !== "thank_you" })),
      introText: "",
      closingText: "",
      churchWhatsappGroupId: "",
    },
    override: { useChurchDefault: true, noFinalPost: false },
    mentions: true,
    tagging: true,
    groupsFailures: options.groupsFailures ?? 0,
    tests: 0,
    calls: [],
  };

  await injectSession(page, { fullName: `Test ${options.persona}` });
  await page.route(/\/graphql\/?$/, async (route, request) => {
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    let q = "";
    let op = "";
    let variables: Record<string, unknown> = {};
    try {
      const body = request.postDataJSON();
      q = body?.query ?? "";
      op = body?.operationName ?? "";
      variables = body?.variables ?? {};
    } catch {
      /* not JSON */
    }
    const respond = (data: unknown) =>
      route.fulfill({ status: 200, headers: CORS, contentType: "application/json", body: JSON.stringify({ data }) });
    const fail = (message: string) =>
      route.fulfill({ status: 200, headers: CORS, contentType: "application/json", body: JSON.stringify({ data: null, errors: [{ message }] }) });

    if (q.includes("currentUserRole")) return respond({ currentUserRole: roleFor(state.persona) });
    if (op) state.calls.push({ op, variables });
    const admin = state.persona === "admin";
    const staff = admin || state.persona === "treasurer";

    switch (op) {
      case "GetWhatsappPostSettings":
        return admin ? respond({ whatsappPostSettings: settingsType(state.church) }) : fail("Admin access required: only admins change the church WhatsApp settings.");
      case "UpdateWhatsappPostSettings": {
        if (!admin) return respond({ updateWhatsappPostSettings: { __typename: "WhatsAppPostSettingsResult", success: false, message: "Admin access required.", settings: null } });
        Object.assign(state.church, variables.input as Partial<ChurchState>);
        return respond({
          updateWhatsappPostSettings: { __typename: "WhatsAppPostSettingsResult", success: true, message: "WhatsApp post settings saved.", settings: settingsType(state.church) },
        });
      }
      case "GetWhatsappGroups":
        if (state.groupsFailures > 0) {
          state.groupsFailures -= 1;
          return fail("The WhatsApp gateway did not answer: connection refused");
        }
        return respond({
          whatsappGroups: [
            { __typename: "WhatsAppGroupType", id: "120363001@g.us", name: "Kawangware Church" },
            { __typename: "WhatsAppGroupType", id: "120363002@g.us", name: "Building Committee" },
          ],
        });
      case "GetCampaigns":
        return respond({
          campaigns: [{
            __typename: "CampaignType", id: "9", title: "Church Building", paybillCode: "BUILD", categoryId: "3",
            categoryName: "Building Fund", status: "ACTIVE", endDate: "2026-12-31", progress: campaignType(state).progress,
          }],
        });
      case "GetCampaign":
        return staff ? respond({ campaign: campaignType(state) }) : fail("Not allowed");
      case "GetCampaignPostSettings":
        return staff ? respond({ campaignPostSettings: overrideType(state) }) : fail("Not allowed");
      case "UpdateCampaignPostSettings": {
        const input = variables.input as Override;
        state.override = { ...state.override, ...input };
        return respond({
          updateCampaignPostSettings: { __typename: "CampaignPostSettingsResult", success: true, message: "WhatsApp post settings saved.", settings: overrideType(state) },
        });
      }
      case "PreviewTotalsPost": {
        const input = (variables.input ?? null) as Override | null;
        const settings = input ? effective(state, { ...state.override, ...input }) : effective(state);
        return respond({ previewTotalsPost: { __typename: "TotalsPostPreview", text: render(settings, state.mentions) } });
      }
      case "SendTestTotalsPost":
        state.tests += 1;
        return respond({
          sendTestTotalsPost: state.tests === 1
            ? { __typename: "MutationResult", success: true, message: "Test post sent to the WhatsApp group." }
            : { __typename: "MutationResult", success: false, message: "A test was posted a few minutes ago. Please wait 10 minutes before sending another." },
        });
      case "UpdateCampaign": {
        const input = variables.input as { whatsappMentionsEnabled?: boolean };
        if (typeof input.whatsappMentionsEnabled === "boolean") state.mentions = input.whatsappMentionsEnabled;
        return respond({ updateCampaign: { __typename: "CampaignResponse", success: true, message: "Campaign updated", campaign: campaignType(state) } });
      }
      case "GetMyWhatsappTagging":
        return respond({ me: { __typename: "MemberType", id: "1", whatsappTagging: state.tagging } });
      case "SetWhatsappTagging":
        state.tagging = Boolean(variables.enabled);
        return respond({
          setWhatsappTagging: {
            __typename: "MutationResult",
            success: true,
            message: state.tagging ? "You will be tagged in WhatsApp thank-yous." : "You will no longer be tagged in WhatsApp posts.",
          },
        });
      default:
        // Anything else the layouts ask for: empty, so nothing hangs on a backend.
        return respond(null);
    }
  });
  return state;
}

/** True when the page does not scroll sideways (phones). */
export async function noSidewaysScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
}

/** Visible form controls in <main> without an accessible name. */
export async function unnamedControls(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    for (const el of Array.from(document.querySelectorAll("main input, main textarea, main select, main button"))) {
      const h = el as HTMLElement;
      if (h.offsetParent === null) continue;
      const labelled =
        h.getAttribute("aria-label") ||
        h.getAttribute("aria-labelledby") ||
        ((h as HTMLInputElement).labels?.length ?? 0) > 0 ||
        (h.tagName === "BUTTON" && (h.textContent ?? "").trim());
      if (!labelled) out.push(h.outerHTML.slice(0, 120));
    }
    return out;
  });
}
