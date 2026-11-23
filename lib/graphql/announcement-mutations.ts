import { gql } from "@apollo/client";

export const CREATE_ANNOUNCEMENT = gql`
  mutation CreateAnnouncement(
    $title: String!
    $content: String!
    $publishDate: String
    $expiryDate: String
    $isActive: Boolean
    $priority: Int
    $postToWhatsapp: Boolean
  ) {
    createAnnouncement(
      title: $title
      content: $content
      publishDate: $publishDate
      expiryDate: $expiryDate
      isActive: $isActive
      priority: $priority
      postToWhatsapp: $postToWhatsapp
    ) {
      success
      message
      announcement {
        id
        title
        content
        publishDate
        expiryDate
        isActive
        priority
        postToWhatsapp
        whatsappStatus
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_ANNOUNCEMENT = gql`
  mutation UpdateAnnouncement(
    $announcementId: ID!
    $title: String
    $content: String
    $publishDate: String
    $expiryDate: String
    $isActive: Boolean
    $priority: Int
    $postToWhatsapp: Boolean
  ) {
    updateAnnouncement(
      announcementId: $announcementId
      title: $title
      content: $content
      publishDate: $publishDate
      expiryDate: $expiryDate
      isActive: $isActive
      priority: $priority
      postToWhatsapp: $postToWhatsapp
    ) {
      success
      message
      announcement {
        id
        title
        content
        publishDate
        expiryDate
        isActive
        priority
        postToWhatsapp
        whatsappStatus
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_ANNOUNCEMENT = gql`
  mutation DeleteAnnouncement($announcementId: ID!) {
    deleteAnnouncement(announcementId: $announcementId) {
      success
      message
    }
  }
`;

export const BULK_CREATE_ANNOUNCEMENTS = gql`
  mutation BulkCreateAnnouncements($items: [BulkAnnouncementInput!]!) {
    bulkCreateAnnouncements(items: $items) {
      success
      message
      createdCount
      failedCount
      errors
      announcements {
        id
        title
        content
        publishDate
        expiryDate
        isActive
        priority
        createdAt
        updatedAt
      }
    }
  }
`;

export const REORDER_ANNOUNCEMENTS = gql`
  mutation ReorderAnnouncements($ids: [ID!]!) {
    reorderAnnouncements(ids: $ids) {
      success
      message
    }
  }
`;

export const TOGGLE_ANNOUNCEMENT_ACTIVE = gql`
  mutation ToggleAnnouncementActive($announcementId: ID!) {
    toggleAnnouncementActive(announcementId: $announcementId) {
      success
      message
      announcement {
        id
        title
        isActive
      }
    }
  }
`;

/** AN-1: queue one more posting to the church WhatsApp group (content managers). */
export const REPOST_ANNOUNCEMENT_TO_WHATSAPP = gql`
  mutation RepostAnnouncementToWhatsapp($id: ID!) {
    repostAnnouncementToWhatsapp(id: $id) {
      success
      message
    }
  }
`;
