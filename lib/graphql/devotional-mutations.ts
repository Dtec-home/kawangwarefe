import { gql } from "@apollo/client";

export const CREATE_DEVOTIONAL = gql`
  mutation CreateDevotional(
    $title: String!
    $content: String!
    $author: String!
    $scriptureReference: String
    $publishDate: String
    $isPublished: Boolean
    $isFeatured: Boolean
    $featuredImageUrl: String
  ) {
    createDevotional(
      title: $title
      content: $content
      author: $author
      scriptureReference: $scriptureReference
      publishDate: $publishDate
      isPublished: $isPublished
      isFeatured: $isFeatured
      featuredImageUrl: $featuredImageUrl
    ) {
      success
      message
      devotional {
        id
        title
        content
        author
        scriptureReference
        publishDate
        isPublished
        isFeatured
        featuredImageUrl
        createdAt
        updatedAt
      }
    }
  }
`;

export const UPDATE_DEVOTIONAL = gql`
  mutation UpdateDevotional(
    $devotionalId: ID!
    $title: String
    $content: String
    $author: String
    $scriptureReference: String
    $publishDate: String
    $isPublished: Boolean
    $isFeatured: Boolean
    $featuredImageUrl: String
  ) {
    updateDevotional(
      devotionalId: $devotionalId
      title: $title
      content: $content
      author: $author
      scriptureReference: $scriptureReference
      publishDate: $publishDate
      isPublished: $isPublished
      isFeatured: $isFeatured
      featuredImageUrl: $featuredImageUrl
    ) {
      success
      message
      devotional {
        id
        title
        content
        author
        scriptureReference
        publishDate
        isPublished
        isFeatured
        featuredImageUrl
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_DEVOTIONAL = gql`
  mutation DeleteDevotional($devotionalId: ID!) {
    deleteDevotional(devotionalId: $devotionalId) {
      success
      message
    }
  }
`;

export const TOGGLE_DEVOTIONAL_FEATURED = gql`
  mutation ToggleDevotionalFeatured($devotionalId: ID!) {
    toggleDevotionalFeatured(devotionalId: $devotionalId) {
      success
      message
      devotional {
        id
        title
        isFeatured
      }
    }
  }
`;

export const TOGGLE_DEVOTIONAL_PUBLISHED = gql`
  mutation ToggleDevotionalPublished($devotionalId: ID!) {
    toggleDevotionalPublished(devotionalId: $devotionalId) {
      success
      message
      devotional {
        id
        title
        isPublished
      }
    }
  }
`;
