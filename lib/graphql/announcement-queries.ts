import { gql } from "@apollo/client";

export const GET_ALL_ANNOUNCEMENTS = gql`
  query GetAllAnnouncements($limit: Int) {
    announcements(limit: $limit) {
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
`;

export const GET_ADMIN_ANNOUNCEMENTS = gql`
  query GetAdminAnnouncements(
    $limit: Int
    $offset: Int
    $search: String
    $status: String
  ) {
    adminAnnouncements(
      limit: $limit
      offset: $offset
      search: $search
      status: $status
    ) {
      total
      hasMore
      items {
        id
        title
        content
        publishDate
        expiryDate
        isActive
        priority
        displayOrder
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_ADMIN_ANNOUNCEMENT_COUNTS = gql`
  query GetAdminAnnouncementCounts {
    adminAnnouncementCounts {
      total
      active
      inactive
      scheduled
      expired
      highPriority
    }
  }
`;
