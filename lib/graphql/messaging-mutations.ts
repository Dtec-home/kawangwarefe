/**
 * Bulk messaging GraphQL (Sprint 6 / E4.2).
 * Staff-only — all queries/mutations require an authenticated admin.
 */

import { gql } from '@apollo/client';

export const GET_MESSAGE_TEMPLATES = gql`
  query GetMessageTemplates {
    messageTemplates {
      id
      name
      body
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const GET_MESSAGE_CAMPAIGNS = gql`
  query GetMessageCampaigns {
    messageCampaigns {
      id
      status
      recipientCount
      sentCount
      failedCount
      startedAt
      completedAt
      createdAt
      template {
        id
        name
      }
    }
  }
`;

export const GET_MESSAGE_CAMPAIGN = gql`
  query GetMessageCampaign($campaignId: ID!) {
    messageCampaign(campaignId: $campaignId) {
      id
      status
      recipientCount
      sentCount
      failedCount
      startedAt
      completedAt
      createdAt
      recipientFilterJson
      template {
        id
        name
        body
      }
    }
    messageCampaignRecipients(campaignId: $campaignId, limit: 200) {
      id
      phoneNumber
      status
      renderedBody
      providerMessageId
      error
      sentAt
    }
  }
`;

export const CREATE_MESSAGE_TEMPLATE = gql`
  mutation CreateMessageTemplate($name: String!, $body: String!) {
    createMessageTemplate(name: $name, body: $body) {
      success
      message
      template {
        id
        name
        body
        isActive
      }
    }
  }
`;

export const UPDATE_MESSAGE_TEMPLATE = gql`
  mutation UpdateMessageTemplate(
    $templateId: ID!
    $name: String
    $body: String
    $isActive: Boolean
  ) {
    updateMessageTemplate(
      templateId: $templateId
      name: $name
      body: $body
      isActive: $isActive
    ) {
      success
      message
      template {
        id
        name
        body
        isActive
      }
    }
  }
`;

export const DELETE_MESSAGE_TEMPLATE = gql`
  mutation DeleteMessageTemplate($templateId: ID!) {
    deleteMessageTemplate(templateId: $templateId) {
      success
      message
    }
  }
`;

export const PREVIEW_CAMPAIGN = gql`
  mutation PreviewCampaign(
    $templateId: ID!
    $recipientFilterJson: String
    $sampleSize: Int
  ) {
    previewCampaign(
      templateId: $templateId
      recipientFilterJson: $recipientFilterJson
      sampleSize: $sampleSize
    ) {
      recipientCount
      skippedCount
      sampleRendered
    }
  }
`;

export const LAUNCH_CAMPAIGN = gql`
  mutation LaunchCampaign($templateId: ID!, $recipientFilterJson: String) {
    launchCampaign(
      templateId: $templateId
      recipientFilterJson: $recipientFilterJson
    ) {
      success
      message
      campaign {
        id
        status
        recipientCount
      }
    }
  }
`;

export const LAUNCH_QUICK_CAMPAIGN = gql`
  mutation LaunchQuickCampaign($body: String!, $recipientFilterJson: String) {
    launchQuickCampaign(body: $body, recipientFilterJson: $recipientFilterJson) {
      success
      message
      campaign {
        id
        status
        recipientCount
      }
    }
  }
`;

export const GET_AVAILABLE_DEPARTMENTS = gql`
  query GetAvailableDepartments {
    availableDepartments {
      id
      name
      code
    }
  }
`;

export const GET_AVAILABLE_GROUPS = gql`
  query GetAvailableGroups {
    availableGroups {
      id
      name
    }
  }
`;

export const MEMBER_SEARCH = gql`
  query MemberSearch($query: String!, $limit: Int) {
    memberSearch(query: $query, limit: $limit) {
      id
      fullName
      phoneNumber
      memberNumber
    }
  }
`;
