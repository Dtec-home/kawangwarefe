/**
 * Admin campaign documents (Fundraising S1, lane S1-UI-A).
 *
 * Hand-written against the frozen SDL (church_BE/fundraising/api/schema.graphql)
 * and typed with lib/types/fundraising.ts.
 */

import { gql } from "@apollo/client";

import type {
  Campaign,
  CampaignCountingMode,
  CampaignInput,
  CampaignResponse,
  CampaignStatus,
} from "@/lib/types/fundraising";

const PROGRESS_FIELDS = `
  progress {
    target
    raised
    remaining
    percent
    donorCount
    giftCount
    pledged
  }
`;

/** What one row of the campaign list needs. */
export type CampaignListItem = Pick<
  Campaign,
  "id" | "title" | "paybillCode" | "categoryId" | "categoryName" | "status" | "endDate" | "progress"
>;

export const GET_CAMPAIGNS = gql`
  query GetCampaigns($status: CampaignStatus, $search: String) {
    campaigns(status: $status, search: $search) {
      id
      title
      paybillCode
      categoryId
      categoryName
      status
      endDate
      ${PROGRESS_FIELDS}
    }
  }
`;

export interface CampaignsData {
  campaigns: CampaignListItem[];
}

export interface CampaignsVars {
  status: CampaignStatus | null;
  search: string | null;
}

/** Every field of a campaign, for the overview and the edit form. */
const CAMPAIGN_FIELDS = `
  id
  title
  slug
  summary
  story
  coverImageUrl
  gallery {
    kind
    url
  }
  categoryId
  categoryName
  purposeId
  purposeName
  targetAmount
  startDate
  endDate
  paybillCode
  whatsappGroupId
  status
  isPublic
  allowPledges
  allowChampions
  reminderPolicy {
    frequency
    daysBeforeDue
    overdueNotices
  }
  createdByName
  approvedByName
  approvedAt
  closedAt
  createdAt
  publicUrl
  paymentInstructions {
    paybillNumber
    accountReference
    text
  }
  ${PROGRESS_FIELDS}
  canApprove
  countingMode
  requestedCountingMode
  countingModeRequestedBy
  canApproveCountingMode
  lastLeaderboardPost {
    status
    attempts
    lastError
    sentAt
    createdAt
  }
`;

const CAMPAIGN_RESPONSE_FIELDS = `
  success
  message
  campaign {
    ${CAMPAIGN_FIELDS}
  }
`;

export const CREATE_CAMPAIGN = gql`
  mutation CreateCampaign($input: CampaignInput!) {
    createCampaign(input: $input) {
      ${CAMPAIGN_RESPONSE_FIELDS}
    }
  }
`;

export interface CreateCampaignData {
  createCampaign: CampaignResponse;
}

export interface CreateCampaignVars {
  input: CampaignInput;
}

export const GET_CAMPAIGN = gql`
  query GetCampaign($id: ID!) {
    campaign(id: $id) {
      ${CAMPAIGN_FIELDS}
    }
  }
`;

export interface CampaignData {
  campaign: Campaign | null;
}

export interface CampaignVars {
  id: string;
}

export const UPDATE_CAMPAIGN = gql`
  mutation UpdateCampaign($id: ID!, $input: CampaignInput!) {
    updateCampaign(id: $id, input: $input) {
      ${CAMPAIGN_RESPONSE_FIELDS}
    }
  }
`;

export interface UpdateCampaignData {
  updateCampaign: CampaignResponse;
}

export interface UpdateCampaignVars {
  id: string;
  input: CampaignInput;
}

export const SUBMIT_CAMPAIGN = gql`
  mutation SubmitCampaign($id: ID!) {
    submitCampaign(id: $id) {
      ${CAMPAIGN_RESPONSE_FIELDS}
    }
  }
`;

export const APPROVE_CAMPAIGN = gql`
  mutation ApproveCampaign($id: ID!) {
    approveCampaign(id: $id) {
      ${CAMPAIGN_RESPONSE_FIELDS}
    }
  }
`;

export const PAUSE_CAMPAIGN = gql`
  mutation PauseCampaign($id: ID!) {
    pauseCampaign(id: $id) {
      ${CAMPAIGN_RESPONSE_FIELDS}
    }
  }
`;

export const RESUME_CAMPAIGN = gql`
  mutation ResumeCampaign($id: ID!) {
    resumeCampaign(id: $id) {
      ${CAMPAIGN_RESPONSE_FIELDS}
    }
  }
`;

export const RETURN_CAMPAIGN_TO_DRAFT = gql`
  mutation ReturnCampaignToDraft($id: ID!, $reason: String!) {
    returnCampaignToDraft(id: $id, reason: $reason) {
      ${CAMPAIGN_RESPONSE_FIELDS}
    }
  }
`;

export interface ReturnCampaignToDraftVars {
  id: string;
  reason: string;
}

export const REQUEST_CAMPAIGN_COUNTING_MODE = gql`
  mutation RequestCampaignCountingMode($id: ID!, $mode: CampaignCountingMode!) {
    requestCampaignCountingMode(id: $id, mode: $mode) {
      ${CAMPAIGN_RESPONSE_FIELDS}
    }
  }
`;

export interface RequestCampaignCountingModeVars {
  id: string;
  mode: CampaignCountingMode;
}

export const APPROVE_CAMPAIGN_COUNTING_MODE = gql`
  mutation ApproveCampaignCountingMode($id: ID!) {
    approveCampaignCountingMode(id: $id) {
      ${CAMPAIGN_RESPONSE_FIELDS}
    }
  }
`;

export const REJECT_CAMPAIGN_COUNTING_MODE = gql`
  mutation RejectCampaignCountingMode($id: ID!, $reason: String!) {
    rejectCampaignCountingMode(id: $id, reason: $reason) {
      ${CAMPAIGN_RESPONSE_FIELDS}
    }
  }
`;

export interface RejectCampaignCountingModeVars {
  id: string;
  reason: string;
}

/** Every status-change mutation answers with a CampaignResponse under its own field name. */
export type CampaignActionData = Record<string, CampaignResponse>;
