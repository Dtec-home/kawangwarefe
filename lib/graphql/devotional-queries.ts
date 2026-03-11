import { gql } from "@apollo/client";

export const GET_ALL_DEVOTIONALS = gql`
  query GetAllDevotionals($limit: Int, $featured: Boolean) {
    devotionals(limit: $limit, featured: $featured) {
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
      isPublished
      isFeatured
      featuredImageUrl
      createdAt
      updatedAt
    }
  }
`;
