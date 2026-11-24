/**
 * Web binding for `whatsapp-posts/whatsapp_posts.feature` (WA-3, WA-2 web).
 *
 * Renders the real screens (church page, campaign tab, profile tagging card)
 * against MockedProvider with the production documents from
 * lib/graphql/whatsapp-posts.ts; the fake server records what was sent.
 */

import { defineFeature, loadFeature } from "jest-cucumber";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MockedProvider, type MockedResponse } from "@apollo/client/testing/react";
import { afterEach, expect, vi } from "vitest";
import React, { type ReactNode } from "react";

const { toast } = vi.hoisted(() => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/components/auth/admin-protected-route", () => ({
  AdminProtectedRoute: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock("@/components/layouts/admin-layout", () => ({
  AdminLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/lib/hooks/use-user-role", () => ({ useUserRole: () => ({ isAdmin: true, loading: false }) }));

import WhatsAppPostsPage from "@/app/(dashboard)/admin/whatsapp-posts/page";
import { CampaignWhatsAppPostsTab } from "@/components/whatsapp-posts/campaign-post-settings-tab";
import { WhatsAppTaggingCard } from "@/components/whatsapp-posts/whatsapp-tagging-card";
import { GET_CAMPAIGN, GET_CAMPAIGNS, UPDATE_CAMPAIGN } from "@/lib/graphql/fundraising/campaigns";
import {
  GET_CAMPAIGN_POST_SETTINGS,
  GET_MY_WHATSAPP_TAGGING,
  GET_WHATSAPP_GROUPS,
  GET_WHATSAPP_POST_SETTINGS,
  PREVIEW_TOTALS_POST,
  SEND_TEST_TOTALS_POST,
  SET_WHATSAPP_TAGGING,
  UPDATE_CAMPAIGN_POST_SETTINGS,
  UPDATE_WHATSAPP_POST_SETTINGS,
} from "@/lib/graphql/whatsapp-posts";
import type { CampaignPostSettingsInput, ChurchPostSettingsInput } from "@/lib/whatsapp-posts/types";

import { campaign, listItem } from "../../components/campaigns/s1_ui_a/fixtures";
import { PREVIEW_TEXT, campaignOverride, church } from "../../lib/whatsapp-posts/fixtures";

const feature = loadFeature("./whatsapp_posts.feature", { loadRelativePath: true });

afterEach(() => {
  toast.success.mockReset();
  toast.error.mockReset();
});

const any = () => true;

/** A fake server: answers every request, keeps what the screens sent. */
interface Sent {
  church: ChurchPostSettingsInput | null;
  campaign: CampaignPostSettingsInput | null;
  campaignInput: Record<string, unknown> | null;
  tests: number;
}
const newSent = (): Sent => ({ church: null, campaign: null, campaignInput: null, tests: 0 });

function previewText(input: CampaignPostSettingsInput | null | undefined, thankYou = false): string {
  const intro = input?.introText ? `${input.introText}\n\n` : "";
  return `${intro}${PREVIEW_TEXT}${thankYou ? "\n\n🙏 Thank you @Kamau!" : ""}`;
}

function serverMocks(sent: Sent, { mentions = true } = {}): MockedResponse[] {
  const c = campaign({ status: "ACTIVE", whatsappGroupId: "120363001@g.us", dailyTotalEnabled: true, dailyTotalPostWhenZero: false, whatsappMentionsEnabled: mentions });
  return [
    { request: { query: GET_WHATSAPP_POST_SETTINGS }, result: { data: { whatsappPostSettings: church() } }, maxUsageCount: 5 },
    {
      request: { query: GET_CAMPAIGNS, variables: { status: null, search: null } },
      result: { data: { campaigns: [listItem({ id: "9", title: "Church Building" })] } },
      maxUsageCount: 5,
    },
    {
      request: { query: GET_WHATSAPP_GROUPS },
      result: { data: { whatsappGroups: [{ __typename: "WhatsAppGroupType", id: "120363001@g.us", name: "Kawangware Church" }] } },
      maxUsageCount: 5,
    },
    { request: { query: GET_CAMPAIGN, variables: { id: "9" } }, result: { data: { campaign: c } }, maxUsageCount: 5 },
    {
      request: { query: GET_CAMPAIGN_POST_SETTINGS, variables: { campaignId: "9" } },
      result: { data: { campaignPostSettings: campaignOverride() } },
      maxUsageCount: 5,
    },
    {
      request: { query: PREVIEW_TOTALS_POST, variables: any },
      result: (vars: { input?: CampaignPostSettingsInput | null }) => ({
        data: { previewTotalsPost: { __typename: "TotalsPostPreview", text: previewText(vars.input, mentions) } },
      }),
      maxUsageCount: 50,
    },
    {
      request: { query: UPDATE_WHATSAPP_POST_SETTINGS, variables: any },
      result: (vars: { input: ChurchPostSettingsInput }) => {
        sent.church = vars.input;
        return { data: { updateWhatsappPostSettings: { __typename: "WhatsAppPostSettingsResult", success: true, message: "WhatsApp post settings saved.", settings: church() } } };
      },
      maxUsageCount: 5,
    },
    {
      request: { query: UPDATE_CAMPAIGN_POST_SETTINGS, variables: any },
      result: (vars: { input: CampaignPostSettingsInput }) => {
        sent.campaign = vars.input;
        return { data: { updateCampaignPostSettings: { __typename: "CampaignPostSettingsResult", success: true, message: "WhatsApp post settings saved.", settings: null } } };
      },
      maxUsageCount: 5,
    },
    {
      request: { query: UPDATE_CAMPAIGN, variables: any },
      result: (vars: { input: Record<string, unknown> }) => {
        sent.campaignInput = vars.input;
        return { data: { updateCampaign: { __typename: "CampaignResponse", success: true, message: "Campaign updated", campaign: { ...c, whatsappMentionsEnabled: vars.input.whatsappMentionsEnabled } } } };
      },
      maxUsageCount: 5,
    },
    {
      request: { query: SEND_TEST_TOTALS_POST, variables: { campaignId: "9" } },
      result: () => {
        sent.tests += 1;
        return sent.tests === 1
          ? { data: { sendTestTotalsPost: { __typename: "MutationResult", success: true, message: "Test post sent to the WhatsApp group." } } }
          : { data: { sendTestTotalsPost: { __typename: "MutationResult", success: false, message: "A test was posted a few minutes ago. Please wait 10 minutes before sending another." } } };
      },
      maxUsageCount: 5,
    },
  ];
}

const renderChurch = (sent: Sent) =>
  render(
    <MockedProvider mocks={serverMocks(sent)}>
      <WhatsAppPostsPage />
    </MockedProvider>,
  );

const renderCampaign = (sent: Sent, mentions = true) =>
  render(
    <MockedProvider mocks={serverMocks(sent, { mentions })}>
      <CampaignWhatsAppPostsTab campaignId="9" previewDelayMs={10} />
    </MockedProvider>,
  );

defineFeature(feature, (test) => {
  test("The admin sets the church-wide schedule (US-22)", ({ given, then, when, and }) => {
    const sent = newSent();
    given("the admin is on the WhatsApp posts page", async () => {
      renderChurch(sent);
      await screen.findByTestId("schedule-summary");
    });
    then(/^the schedule reads "(.+)"$/, (summary: string) => {
      expect(screen.getByTestId("schedule-summary")).toHaveTextContent(summary);
    });
    when(/^the admin chooses fixed times "(.+)" and "(.+)"$/, (first: string, second: string) => {
      fireEvent.click(screen.getByLabelText("At fixed times"));
      fireEvent.click(screen.getByRole("button", { name: "Add a time" }));
      fireEvent.change(screen.getByLabelText("Fixed time 1"), { target: { value: first } });
      fireEvent.click(screen.getByRole("button", { name: "Add a time" }));
      fireEvent.change(screen.getByLabelText("Fixed time 2"), { target: { value: second } });
    });
    and("the admin saves the church settings", () => {
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
    });
    then(/^the church settings are saved with fixed times "(.+)"$/, async (times: string) => {
      await waitFor(() => expect(sent.church).not.toBeNull());
      expect(sent.church?.scheduleKind).toBe("fixed_times");
      expect(sent.church?.fixedTimes).toEqual(times.split(", "));
      expect(toast.success).toHaveBeenCalledWith("WhatsApp post settings saved.");
    });
  });

  test("A campaign changes its interval and follows the church for the rest (US-22)", ({ given, when, and, then }) => {
    const sent = newSent();
    given(/^the campaign "(.+)" follows the church settings$/, async () => {
      renderCampaign(sent);
      const follow = await screen.findByRole("switch", { name: "Use the church settings" });
      expect(follow).toHaveAttribute("aria-checked", "true");
    });
    when("the admin stops using the church settings for the campaign", () => {
      fireEvent.click(screen.getByRole("switch", { name: "Use the church settings" }));
    });
    and(/^the admin posts every "(.+)" for the campaign$/, (label: string) => {
      const select = screen.getByLabelText("Post every") as HTMLSelectElement;
      const option = Array.from(select.options).find((o) => o.text === label)!;
      fireEvent.change(select, { target: { value: option.value } });
    });
    and("the admin saves the campaign settings", () => {
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
    });
    then(/^the campaign saves only "(.+)" as (\d+), the rest follow the church$/, async (field: string, value: string) => {
      await waitFor(() => expect(sent.campaign).not.toBeNull());
      const input = sent.campaign as Record<string, unknown>;
      expect(input.useChurchDefault).toBe(false);
      expect(input[field]).toBe(Number(value));
      const others = Object.entries(input).filter(([k]) => !["useChurchDefault", "noFinalPost", field].includes(k));
      expect(others.every(([, v]) => v === null)).toBe(true);
    });
  });

  test("The admin builds the message with a live preview (US-23)", ({ given, when, and, then }) => {
    const sent = newSent();
    given("the admin is on the WhatsApp posts page", async () => {
      renderChurch(sent);
      await screen.findByTestId("schedule-summary");
    });
    when(/^the admin switches on the "(.+)" block$/, (label: string) => {
      fireEvent.click(screen.getByRole("switch", { name: `Show ${label}` }));
    });
    and(/^the admin moves "(.+)" up$/, (label: string) => {
      fireEvent.click(screen.getByRole("button", { name: `Move ${label} up` }));
    });
    and(/^the admin writes the intro "(.+)"$/, (text: string) => {
      fireEvent.change(screen.getByLabelText("Intro text"), { target: { value: text } });
    });
    then(/^the preview shows "(.+)"$/, async (text: string) => {
      await waitFor(() => expect(screen.getByTestId("totals-preview")).toHaveTextContent(text), { timeout: 3000 });
    });
    when("the admin saves the church settings", () => {
      fireEvent.click(screen.getByRole("button", { name: "Save" }));
    });
    then(/^the saved layout has "(.+)" before "(.+)"$/, async (first: string, second: string) => {
      await waitFor(() => expect(sent.church).not.toBeNull());
      const keys = (sent.church?.layout ?? []).map((b) => b.block);
      expect(keys.indexOf(first)).toBeLessThan(keys.indexOf(second));
      expect(sent.church?.layout?.find((b) => b.block === first)?.enabled).toBe(true);
      expect(sent.church?.introText).toBe("Karibu wote!");
    });
  });

  test("Givers are tagged unless the campaign switches it off (US-20)", ({ given, then, when }) => {
    const sent = newSent();
    given(/^the campaign "(.+)" tags givers$/, async () => {
      renderCampaign(sent, true);
      const tag = await screen.findByRole("switch", { name: "Tag givers in group posts" });
      await waitFor(() => expect(tag).toHaveAttribute("aria-checked", "true"));
    });
    then(/^the preview shows "(.+)"$/, async (text: string) => {
      await waitFor(() => expect(screen.getByTestId("totals-preview")).toHaveTextContent(text));
    });
    when(/^the admin switches off "(.+)"$/, (label: string) => {
      fireEvent.click(screen.getByRole("switch", { name: label }));
    });
    then("the campaign is saved with tagging off", async () => {
      await waitFor(() => expect(sent.campaignInput).not.toBeNull());
      expect(sent.campaignInput?.whatsappMentionsEnabled).toBe(false);
      expect(sent.campaignInput?.title).toBe("Church Building");
      // The counting mode is left out so the backend keeps it.
      expect(sent.campaignInput?.countingMode).toBeNull();
    });
  });

  test("A member switches off being tagged (US-21)", ({ given, when, then }) => {
    given("a member who is tagged in WhatsApp thank-yous", async () => {
      render(
        <MockedProvider
          mocks={[
            { request: { query: GET_MY_WHATSAPP_TAGGING }, result: { data: { me: { __typename: "MemberType", id: "1", whatsappTagging: true } } } },
            {
              request: { query: SET_WHATSAPP_TAGGING, variables: { enabled: false } },
              result: { data: { setWhatsappTagging: { __typename: "MutationResult", success: true, message: "You will no longer be tagged in WhatsApp posts." } } },
            },
          ]}
        >
          <WhatsAppTaggingCard />
        </MockedProvider>,
      );
      const toggle = await screen.findByRole("switch", { name: "Tag me in WhatsApp group thank-yous" });
      await waitFor(() => expect(toggle).toHaveAttribute("aria-checked", "true"));
    });
    when(/^the member switches off "(.+)"$/, (label: string) => {
      fireEvent.click(screen.getByRole("switch", { name: label }));
    });
    then(/^the member is told "(.+)"$/, async (message: string) => {
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith(message));
      expect(screen.getByRole("switch", { name: "Tag me in WhatsApp group thank-yous" })).toHaveAttribute("aria-checked", "false");
    });
  });

  test("A second test within 10 minutes is refused with the reason (US-22)", ({ given, when, then, and }) => {
    const sent = newSent();
    given(/^the campaign "(.+)" follows the church settings$/, async () => {
      renderCampaign(sent);
      await screen.findByRole("switch", { name: "Use the church settings" });
    });
    when("the admin sends a test to the group twice", async () => {
      const button = await screen.findByRole("button", { name: "Send a test to the group now" });
      await waitFor(() => expect(button).toBeEnabled());
      fireEvent.click(button);
      await waitFor(() => expect(sent.tests).toBe(1));
      await waitFor(() => expect(button).toBeEnabled());
      fireEvent.click(button);
    });
    then("the first test is sent", async () => {
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Test post sent to the WhatsApp group."));
    });
    and("the second is refused, explaining the 10-minute limit", async () => {
      const note = await screen.findByTestId("send-test-refused");
      expect(note).toHaveTextContent("Please wait 10 minutes");
      expect(note).toHaveTextContent("One test can go to the group every 10 minutes for each campaign.");
    });
  });
});
