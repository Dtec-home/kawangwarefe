/**
 * GraphQL Queries
 * Following DRY: Centralized query definitions
 */

import { gql } from "@apollo/client";

/**
 * Get all active contribution categories
 */
export const GET_CONTRIBUTION_CATEGORIES = gql`
  query GetContributionCategories($audience: String) {
    contributionCategories(isActive: true, audience: $audience) {
      id
      name
      code
      description
      isActive
      routingMode
      fallbackIfNoGroup
      audience
      hasAutoSplit
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

/**
 * Public lookup of a giver's department member number (e.g. Welfare number)
 * used to pre-fill / confirm on the contribute form after the phone is entered.
 */
export const GET_MEMBER_DEPARTMENT_IDENTIFIER = gql`
  query GetMemberDepartmentIdentifier($phoneNumber: String!, $categoryId: ID!) {
    memberDepartmentIdentifier(phoneNumber: $phoneNumber, categoryId: $categoryId) {
      tracksIdentifier
      label
      found
      identifier
    }
  }
`;

/**
 * Get active purposes for a department/category.
 */
export const GET_DEPARTMENT_PURPOSES = gql`
  query GetDepartmentPurposes($categoryId: ID!, $isActive: Boolean) {
    departmentPurposes(categoryId: $categoryId, isActive: $isActive) {
      id
      name
      code
      description
      isActive
    }
  }
`;

/**
 * Get a formatted paybill instruction message for in-app display.
 */
export const GET_PAYBILL_INSTRUCTION_MESSAGE = gql`
  query GetPaybillInstructionMessage(
    $categoryCode: String!
    $purposeCode: String
    $amount: String
  ) {
    paybillInstructionMessage(
      categoryCode: $categoryCode
      purposeCode: $purposeCode
      amount: $amount
    )
  }
`;

/**
 * Get contributions for a specific member
 */
export const GET_MY_CONTRIBUTIONS = gql`
  query GetMyContributions($phoneNumber: String!, $limit: Int, $categoryId: ID) {
    myContributions(
      phoneNumber: $phoneNumber
      limit: $limit
      categoryId: $categoryId
    ) {
      id
      amount
      status
      transactionDate
      notes
      isCompleted
      contributionGroupId
      purposeName
      routedGroupName
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
      mpesaTransaction {
        id
        mpesaReceiptNumber
        transactionDate
        status
        resultDesc
      }
    }
  }
`;

/**
 * Get active purpose allocations for a category (auto-split configuration).
 */
export const GET_CATEGORY_ALLOCATIONS = gql`
  query GetCategoryAllocations($categoryId: ID!) {
    categoryAllocations(categoryId: $categoryId) {
      id
      percentage
      isActive
      purpose {
        id
        name
        code
      }
    }
  }
`;

/**
 * Get a single contribution by ID
 */
export const GET_CONTRIBUTION = gql`
  query GetContribution($id: ID!) {
    contribution(id: $id) {
      id
      amount
      status
      transactionDate
      notes
      isCompleted
      departmentMemberIdentifier
      member {
        id
        fullName
        phoneNumber
        memberNumber
      }
      category {
        id
        name
        code
        description
      }
      mpesaTransaction {
        id
        phoneNumber
        amount
        status
        mpesaReceiptNumber
        transactionDate
        resultDesc
      }
    }
  }
`;

/**
 * Get member by phone number
 */
export const GET_MEMBER_BY_PHONE = gql`
  query GetMemberByPhone($phoneNumber: String!) {
    memberByPhone(phoneNumber: $phoneNumber) {
      id
      fullName
      firstName
      lastName
      phoneNumber
      memberNumber
      email
      isActive
    }
  }
`;

/**
 * Get the authenticated member's contribution totals and breakdowns.
 */
export const GET_MY_CONTRIBUTION_STATS = gql`
  query GetMyContributionStats {
    myContributionStats {
      totalAmount
      totalCount
      byDepartment {
        department {
          id
          name
          code
        }
        totalAmount
        totalCount
        byPurpose {
          purpose {
            id
            name
            code
          }
          totalAmount
          totalCount
        }
        byGroup {
          group {
            id
            name
          }
          totalAmount
          totalCount
          isTopLevel
        }
      }
    }
  }
`;