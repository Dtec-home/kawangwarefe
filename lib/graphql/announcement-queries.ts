import { gql } from "@apollo/client";

export const GET_ALL_ANNOUNCEMENTS = gql`
  query GetAllAnnouncements($limit: Int) {
    announcements(limit: $limit) {
      id
      title
      content
      publishDate
      isActive
      priority
      createdAt
      updatedAt
    }
  }
`;
