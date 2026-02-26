import { gql } from '@apollo/client';

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($name: String!, $code: String!, $description: String) {
    createCategory(name: $name, code: $code, description: $description) {
      success
      message
      category {
        id
        name
        code
        description
        isActive
      }
    }
  }
`;

export const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($categoryId: ID!, $name: String, $code: String, $description: String, $isActive: Boolean) {
    updateCategory(categoryId: $categoryId, name: $name, code: $code, description: $description, isActive: $isActive) {
      success
      message
      category {
        id
        name
        code
        description
        isActive
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
  query GetAllCategories {
    contributionCategories {
      id
      name
      code
      description
      isActive
    }
  }
`;
