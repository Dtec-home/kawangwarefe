import { gql } from "@apollo/client";

/**
 * GraphQL queries for church website content
 */

export const GET_LANDING_PAGE_CONTENT = gql`
  query GetLandingPageContent {
    announcements(limit: 5) {
      id
      title
      content
      publishDate
      priority
    }

    devotionals(limit: 6) {
      id
      title
      content
      author
      scriptureReference
      publishDate
      isFeatured
      featuredImageUrl
    }

    events(upcoming: true, limit: 6) {
      id
      title
      description
      eventDate
      eventTime
      location
      registrationLink
      featuredImageUrl
    }

    youtubeVideos(limit: 6, featured: true) {
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

export const GET_DEVOTIONAL = gql`
  query GetDevotional($id: ID!) {
    devotional(id: $id) {
      id
      title
      content
      author
      scriptureReference
      publishDate
      featuredImageUrl
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
      featuredImageUrl
    }
  }
`;
