import { gql } from "@apollo/client";

export const GET_ALL_EVENTS = gql`
  query GetAllEvents($upcoming: Boolean, $limit: Int) {
    events(upcoming: $upcoming, limit: $limit) {
      id
      title
      description
      eventDate
      eventTime
      location
      registrationLink
      isActive
      featuredImageUrl
      createdAt
      updatedAt
    }
  }
`;

export const GET_EVENT = gql`
  query GetEvent($id: ID!) {
    event(id: $id) {
      id
      title
      description
      eventDate
      eventTime
      location
      registrationLink
      isActive
      featuredImageUrl
      createdAt
      updatedAt
    }
  }
`;
