/**
 * Category Admin GraphQL Queries and Mutations
 *
 * Manages category-specific admin roles
 */

import { gql } from "@apollo/client";

/**
 * Get all category admins
 */
export const GET_CATEGORY_ADMINS = gql`
  query GetCategoryAdmins($categoryId: ID) {
    categoryAdmins(categoryId: $categoryId) {
      id
      member {
        id
        fullName
        phoneNumber
        memberNumber
        email
      }
      category {
        id
        name
        code
        description
      }
      assignedBy {
        id
        fullName
      }
      assignedAt
      isActive
    }
  }
`;

/**
 * Get category admins for a specific member
 */
export const GET_MY_CATEGORY_ADMIN_ROLES = gql`
  query GetMyCategoryAdminRoles($memberId: ID!) {
    myCategoryAdminRoles(memberId: $memberId) {
      id
      category {
        id
        name
        code
        description
      }
      assignedAt
      isActive
    }
  }
`;

/**
 * Assign a member as category admin
 */
export const ASSIGN_CATEGORY_ADMIN = gql`
  mutation AssignCategoryAdmin($memberId: ID!, $categoryId: ID!) {
    assignCategoryAdmin(memberId: $memberId, categoryId: $categoryId) {
      success
      message
      categoryAdmin {
        id
        member {
          id
          fullName
          phoneNumber
        }
        category {
          id
          name
          code
        }
        assignedAt
        isActive
      }
    }
  }
`;

/**
 * Remove category admin role
 */
export const REMOVE_CATEGORY_ADMIN = gql`
  mutation RemoveCategoryAdmin($categoryAdminId: ID!) {
    removeCategoryAdmin(categoryAdminId: $categoryAdminId) {
      success
      message
    }
  }
`;

/**
 * Check if current user is admin for a specific category
 */
export const CHECK_CATEGORY_ADMIN_ACCESS = gql`
  query CheckCategoryAdminAccess($categoryId: ID!, $memberId: ID!) {
    isCategoryAdmin(categoryId: $categoryId, memberId: $memberId)
  }
`;
