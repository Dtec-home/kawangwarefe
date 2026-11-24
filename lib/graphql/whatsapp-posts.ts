/**
 * WhatsApp totals-post settings, preview, test post, groups (WA-3) and the
 * member's tagging switch (WA-2). Written against the live schema
 * (church_BE/fundraising/api/post_settings.py, api_schema/whatsapp_tagging_api.py).
 */

import { gql } from "@apollo/client";

import type {
  CampaignPostSettings,
  CampaignPostSettingsInput,
  ChurchPostSettings,
  ChurchPostSettingsInput,
  WhatsAppGroup,
} from "@/lib/whatsapp-posts/types";

const BLOCK_FIELDS = `
  block
  enabled
  label
  description
`;

const SETTINGS_FIELDS = `
  scheduleKind
  intervalMinutes
  windowStart
  windowEnd
  daysOfWeek
  fixedTimes
  finalPostTime
  onlyWhenChanged
  postWhenZero
  layout { ${BLOCK_FIELDS} }
  introText
  closingText
  churchWhatsappGroupId
  availableBlocks { ${BLOCK_FIELDS} }
`;

const CAMPAIGN_SETTINGS_FIELDS = `
  campaignId
  useChurchDefault
  scheduleKind
  intervalMinutes
  windowStart
  windowEnd
  daysOfWeek
  fixedTimes
  finalPostTime
  noFinalPost
  onlyWhenChanged
  postWhenZero
  layout { ${BLOCK_FIELDS} }
  introText
  closingText
  effective { ${SETTINGS_FIELDS} }
`;

export const GET_WHATSAPP_POST_SETTINGS = gql`
  query GetWhatsappPostSettings {
    whatsappPostSettings {
      ${SETTINGS_FIELDS}
    }
  }
`;

export interface WhatsappPostSettingsData {
  whatsappPostSettings: ChurchPostSettings;
}

export const UPDATE_WHATSAPP_POST_SETTINGS = gql`
  mutation UpdateWhatsappPostSettings($input: WhatsAppPostSettingsInput!) {
    updateWhatsappPostSettings(input: $input) {
      success
      message
      settings {
        ${SETTINGS_FIELDS}
      }
    }
  }
`;

export interface UpdateWhatsappPostSettingsData {
  updateWhatsappPostSettings: { success: boolean; message: string; settings: ChurchPostSettings | null };
}

export interface UpdateWhatsappPostSettingsVars {
  input: ChurchPostSettingsInput;
}

export const GET_CAMPAIGN_POST_SETTINGS = gql`
  query GetCampaignPostSettings($campaignId: ID!) {
    campaignPostSettings(campaignId: $campaignId) {
      ${CAMPAIGN_SETTINGS_FIELDS}
    }
  }
`;

export interface CampaignPostSettingsData {
  campaignPostSettings: CampaignPostSettings;
}

export interface CampaignPostSettingsVars {
  campaignId: string;
}

export const UPDATE_CAMPAIGN_POST_SETTINGS = gql`
  mutation UpdateCampaignPostSettings($campaignId: ID!, $input: CampaignPostSettingsInput!) {
    updateCampaignPostSettings(campaignId: $campaignId, input: $input) {
      success
      message
      settings {
        ${CAMPAIGN_SETTINGS_FIELDS}
      }
    }
  }
`;

export interface UpdateCampaignPostSettingsData {
  updateCampaignPostSettings: { success: boolean; message: string; settings: CampaignPostSettings | null };
}

export interface UpdateCampaignPostSettingsVars {
  campaignId: string;
  input: CampaignPostSettingsInput;
}

export const PREVIEW_TOTALS_POST = gql`
  query PreviewTotalsPost($campaignId: ID!, $input: CampaignPostSettingsInput) {
    previewTotalsPost(campaignId: $campaignId, input: $input) {
      text
    }
  }
`;

export interface PreviewTotalsPostData {
  previewTotalsPost: { text: string };
}

export interface PreviewTotalsPostVars {
  campaignId: string;
  input: CampaignPostSettingsInput | null;
}

export const SEND_TEST_TOTALS_POST = gql`
  mutation SendTestTotalsPost($campaignId: ID!) {
    sendTestTotalsPost(campaignId: $campaignId) {
      success
      message
    }
  }
`;

export interface SendTestTotalsPostData {
  sendTestTotalsPost: { success: boolean; message: string };
}

export const GET_WHATSAPP_GROUPS = gql`
  query GetWhatsappGroups {
    whatsappGroups {
      id
      name
    }
  }
`;

export interface WhatsappGroupsData {
  whatsappGroups: WhatsAppGroup[];
}

/** WA-2: the member's own "tag me" switch. */
export const GET_MY_WHATSAPP_TAGGING = gql`
  query GetMyWhatsappTagging {
    me {
      id
      whatsappTagging
    }
  }
`;

export interface MyWhatsappTaggingData {
  me: { id: string; whatsappTagging: boolean } | null;
}

export const SET_WHATSAPP_TAGGING = gql`
  mutation SetWhatsappTagging($enabled: Boolean!) {
    setWhatsappTagging(enabled: $enabled) {
      success
      message
    }
  }
`;

export interface SetWhatsappTaggingData {
  setWhatsappTagging: { __typename?: "MutationResult"; success: boolean; message: string };
}
