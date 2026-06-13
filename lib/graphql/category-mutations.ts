import { gql } from '@apollo/client';

export const CREATE_CATEGORY = gql`
  mutation CreateCategory(
    $name: String!
    $code: String!
    $description: String
    $routingMode: String
    $fallbackIfNoGroup: String
    $allowedGroupIds: [ID!]
    $audience: String
    $tracksMemberIdentifier: Boolean
    $identifierLabel: String
    $identifierFormat: String
  ) {
    createCategory(
      name: $name
      code: $code
      description: $description
      routingMode: $routingMode
      fallbackIfNoGroup: $fallbackIfNoGroup
      allowedGroupIds: $allowedGroupIds
      audience: $audience
      tracksMemberIdentifier: $tracksMemberIdentifier
      identifierLabel: $identifierLabel
      identifierFormat: $identifierFormat
    ) {
      success
      message
      category {
        id
        name
        code
        description
        isActive
        routingMode
        fallbackIfNoGroup
        audience
        tracksMemberIdentifier
        identifierLabel
        identifierFormat
        allowedGroups {
          id
          name
        }
      }
    }
  }
`;

export const UPDATE_CATEGORY = gql`
  mutation UpdateCategory(
    $categoryId: ID!
    $name: String
    $code: String
    $description: String
    $isActive: Boolean
    $routingMode: String
    $fallbackIfNoGroup: String
    $allowedGroupIds: [ID!]
    $audience: String
    $tracksMemberIdentifier: Boolean
    $identifierLabel: String
    $identifierFormat: String
  ) {
    updateCategory(
      categoryId: $categoryId
      name: $name
      code: $code
      description: $description
      isActive: $isActive
      routingMode: $routingMode
      fallbackIfNoGroup: $fallbackIfNoGroup
      allowedGroupIds: $allowedGroupIds
      audience: $audience
      tracksMemberIdentifier: $tracksMemberIdentifier
      identifierLabel: $identifierLabel
      identifierFormat: $identifierFormat
    ) {
      success
      message
      category {
        id
        name
        code
        description
        isActive
        routingMode
        fallbackIfNoGroup
        audience
        tracksMemberIdentifier
        identifierLabel
        identifierFormat
        allowedGroups {
          id
          name
        }
      }
    }
  }
`;

export const DELETE_CATEGORY = gql`
  mutation DeleteCategory($categoryId: ID!) {
    deleteCategory(categoryId: $categoryId) {
      success
      message
    }
  }
`;

export const GET_ALL_CATEGORIES = gql`
  query GetAllCategories($audience: String, $includeInactive: Boolean) {
    contributionCategories(audience: $audience, includeInactive: $includeInactive) {
      id
      name
      code
      description
      isActive
      routingMode
      fallbackIfNoGroup
      audience
      tracksMemberIdentifier
      identifierLabel
      identifierFormat
      allowedGroups {
        id
        name
      }
    }
  }
`;
