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
      isPayable
      category {
        id
        name
      }
      purpose {
        id
        name
      }
      suggestedAmount
      displayOrder
      requiresRegistration
      registrationCount
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
      isPayable
      category {
        id
        name
      }
      purpose {
        id
        name
      }
      suggestedAmount
      displayOrder
      requiresRegistration
      registrationCount
      createdAt
      updatedAt
    }
  }
`;

export const EVENT_GIVING_SUMMARY = gql`
  query EventGivingSummary($eventId: ID!) {
    eventGivingSummary(eventId: $eventId) {
      totalAmount
      contributionCount
    }
  }
`;

export const EVENT_REGISTRATIONS = gql`
  query EventRegistrations($eventId: ID!) {
    eventRegistrations(eventId: $eventId) {
      id
      guestName
      guestPhone
      status
      registeredAt
      member {
        id
        fullName
      }
    }
  }
`;
