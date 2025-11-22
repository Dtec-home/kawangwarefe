/**
 * Admin GraphQL Queries
 * Sprint 3: Admin Dashboard
 */

import { gql } from "@apollo/client";

/**
 * Get all contributions with filters and pagination
 */
export const GET_ALL_CONTRIBUTIONS = gql`
  query GetAllContributions(
    $filters: ContributionFilters
    $pagination: PaginationInput
  ) {
    allContributions(filters: $filters, pagination: $pagination) {
      items {
        id
        amount
        status
        transactionDate
        notes
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
        }
        mpesaTransaction {
          id
          mpesaReceiptNumber
          status
          resultDesc
        }
      }
      total
      hasMore
    }
  }
`;

/**
 * Get contribution statistics
 */
export const GET_CONTRIBUTION_STATS = gql`
  query GetContributionStats($dateFrom: DateTime, $dateTo: DateTime) {
    contributionStats(dateFrom: $dateFrom, dateTo: $dateTo) {
      totalAmount
      totalCount
      completedAmount
      completedCount
      pendingAmount
      pendingCount
      failedCount
    }
  }
`;

/**
 * Get dashboard statistics
 */
export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      todayTotal
      todayCount
      weekTotal
      weekCount
      monthTotal
      monthCount
      totalAmount
      totalCount
      totalMembers
      activeMembers
    }
  }
`;

/**
 * Get members list
 */
export const GET_MEMBERS_LIST = gql`
  query GetMembersList(
    $search: String
    $isActive: Boolean
    $limit: Int
    $offset: Int
  ) {
    membersList(
      search: $search
      isActive: $isActive
      limit: $limit
      offset: $offset
    ) {
      id
      fullName
      firstName
      lastName
      phoneNumber
      memberNumber
      email
      isActive
      createdAt
    }
  }
`;
