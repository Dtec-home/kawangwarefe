import { gql } from "@apollo/client";

export const CREATE_EVENT = gql`
  mutation CreateEvent(
    $title: String!
    $description: String!
    $eventDate: String!
    $eventTime: String!
    $location: String!
    $registrationLink: String
    $isActive: Boolean
    $featuredImageUrl: String
  ) {
    createEvent(
      title: $title
      description: $description
      eventDate: $eventDate
      eventTime: $eventTime
      location: $location
      registrationLink: $registrationLink
      isActive: $isActive
      featuredImageUrl: $featuredImageUrl
    ) {
      success
      message
      event {
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
  }
`;

export const UPDATE_EVENT = gql`
  mutation UpdateEvent(
    $eventId: ID!
    $title: String
    $description: String
    $eventDate: String
    $eventTime: String
    $location: String
    $registrationLink: String
    $isActive: Boolean
    $featuredImageUrl: String
  ) {
    updateEvent(
      eventId: $eventId
      title: $title
      description: $description
      eventDate: $eventDate
      eventTime: $eventTime
      location: $location
      registrationLink: $registrationLink
      isActive: $isActive
      featuredImageUrl: $featuredImageUrl
    ) {
      success
      message
      event {
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
  }
`;

export const DELETE_EVENT = gql`
  mutation DeleteEvent($eventId: ID!) {
    deleteEvent(eventId: $eventId) {
      success
      message
    }
  }
`;

export const TOGGLE_EVENT_ACTIVE = gql`
  mutation ToggleEventActive($eventId: ID!) {
    toggleEventActive(eventId: $eventId) {
      success
      message
      event {
        id
        title
        isActive
      }
    }
  }
`;
