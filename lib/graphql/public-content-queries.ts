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
    events(upcoming: false, limit: 50) {
      id
      title
      description
      eventDate
      eventTime
      location
      registrationLink
      featuredImageUrl
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
