import { gql } from "@apollo/client";

/**
 * GraphQL queries for individual public content pages
 */

export const GET_ALL_ANNOUNCEMENTS = gql`
  query GetAllAnnouncements {
    announcements(limit: 50) {
      id
      title
      content
      publishDate
      expiryDate
      priority
    }
  }
`;

export const GET_ALL_DEVOTIONALS = gql`
  query GetAllDevotionals {
    devotionals(limit: 50) {
      id
      title
      content
      author
      scriptureReference
      publishDate
      isFeatured
      featuredImageUrl
    }
  }
`;

export const GET_ALL_EVENTS = gql`
  query GetAllEvents {
    events(upcoming: null, limit: 50) {
      id
      title
      description
      eventDate
      eventTime
      location
      registrationLink
      featuredImageUrl
      isPayable
      suggestedAmount
      requiresRegistration
      registrationCount
      category {
        id
        name
      }
      purpose {
        id
        name
      }
    }
  }
`;

/** Public, no-auth mutation: register the current visitor (member or guest) for an event. */
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

export const GET_ALL_VIDEOS = gql`
  query GetAllVideos {
    youtubeVideos(limit: 50) {
      id
      title
      videoId
      description
      category
      embedUrl
      thumbnailUrl
      watchUrl
    }
  }
`;
