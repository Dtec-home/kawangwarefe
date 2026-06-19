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
    $categoryId: ID
    $purposeId: ID
    $suggestedAmount: String
    $displayOrder: Int
    $requiresRegistration: Boolean
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
      categoryId: $categoryId
      purposeId: $purposeId
      suggestedAmount: $suggestedAmount
      displayOrder: $displayOrder
      requiresRegistration: $requiresRegistration
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
    $categoryId: ID
    $purposeId: ID
    $suggestedAmount: String
    $displayOrder: Int
    $requiresRegistration: Boolean
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
      categoryId: $categoryId
      purposeId: $purposeId
      suggestedAmount: $suggestedAmount
      displayOrder: $displayOrder
      requiresRegistration: $requiresRegistration
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

export const REORDER_EVENTS = gql`
  mutation ReorderEvents($ids: [ID!]!) {
    reorderEvents(ids: $ids) {
      success
      message
    }
  }
`;

export const REGISTER_FOR_EVENT = gql`
  mutation RegisterForEvent($eventId: ID!, $name: String!, $phone: String) {
    registerForEvent(eventId: $eventId, name: $name, phone: $phone) {
      success
      message
      registration {
        id
        guestName
        guestPhone
        status
        registeredAt
      }
    }
  }
`;

export const CANCEL_REGISTRATION = gql`
  mutation CancelRegistration($registrationId: ID!) {
    cancelRegistration(registrationId: $registrationId) {
      success
      message
      registration {
        id
        status
      }
    }
  }
`;
