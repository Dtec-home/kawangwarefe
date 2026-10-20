/**
 * Campaign update documents (Fundraising S2, lane S2-UI-D, ticket 2.12).
 *
 * Hand-written against the frozen SDL (church_BE/fundraising/api/schema.graphql)
 * and typed with lib/types/fundraising.ts.
 */

import { gql } from "@apollo/client";

import type { CampaignUpdate, CampaignUpdateResponse, MutationResult } from "@/lib/types/fundraising";

const UPDATE_FIELDS = `
  id
  title
  body
  imageUrl
  publishedAt
  smsSentAt
  postedByName
`;

export const GET_CAMPAIGN_UPDATES = gql`
  query GetCampaignUpdates($campaignId: ID!) {
    campaignUpdates(campaignId: $campaignId) {
      ${UPDATE_FIELDS}
    }
  }
`;

export interface CampaignUpdatesData {
  campaignUpdates: CampaignUpdate[];
}

export interface CampaignUpdatesVars {
  campaignId: string;
}

export const POST_CAMPAIGN_UPDATE = gql`
  mutation PostCampaignUpdate(
    $campaignId: ID!
    $title: String!
    $body: String!
    $imageUrl: String!
    $smsDonors: Boolean!
  ) {
    postCampaignUpdate(
      campaignId: $campaignId
      title: $title
      body: $body
      imageUrl: $imageUrl
      smsDonors: $smsDonors
    ) {
      success
      message
      update {
        ${UPDATE_FIELDS}
      }
    }
  }
`;

export interface PostCampaignUpdateData {
  postCampaignUpdate: CampaignUpdateResponse;
}

export interface PostCampaignUpdateVars {
  campaignId: string;
  title: string;
  body: string;
  imageUrl: string;
  smsDonors: boolean;
}

export const REMOVE_CAMPAIGN_UPDATE = gql`
  mutation RemoveCampaignUpdate($id: ID!) {
    removeCampaignUpdate(id: $id) {
      success
      message
    }
  }
`;

export interface RemoveCampaignUpdateData {
  removeCampaignUpdate: MutationResult;
}

export interface RemoveCampaignUpdateVars {
  id: string;
}
