/**
 * GraphQL Queries
 * Following DRY: Centralized query definitions
 */

import { gql } from "@apollo/client";

/**
 * Get all active contribution categories
 */
export const GET_CONTRIBUTION_CATEGORIES = gql`
  query GetContributionCategories {
    contributionCategories(isActive: true) {
      id
      name
      code
      description
      isActive
    }
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