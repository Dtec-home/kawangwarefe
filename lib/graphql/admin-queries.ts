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
        routedGroupName
        purposeName
        contributionGroupId
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
      items {
        id
        fullName
        firstName
        lastName
        phoneNumber
        memberNumber
        email
        isActive
        createdAt
        roles
        groups {
          id
          name
        }
      }
      total
      hasMore
    }
  }
`;

/**
 * Get department routing analytics report.
 */
export const GET_DEPARTMENT_ROUTING_REPORT = gql`
  query GetDepartmentRoutingReport(
    $dateFrom: DateTime
    $dateTo: DateTime
    $categoryId: ID
    $purposeId: ID
    $groupId: ID
    $routingType: String
  ) {
    departmentRoutingReport(
      dateFrom: $dateFrom
      dateTo: $dateTo
      categoryId: $categoryId
      purposeId: $purposeId
      groupId: $groupId
      routingType: $routingType
    ) {
      summary {
        totalCompletedAmount
        totalCompletedCount
        guestTopLevelAmount
        guestTopLevelCount
        memberRoutedAmount
        memberRoutedCount
        memberTopLevelAmount
        memberTopLevelCount
      }
      byDepartment {
        departmentId
        departmentName
        departmentCode
        totalAmount
        totalCount
      }
      byDepartmentPurpose {
        departmentId
        departmentName
        departmentCode
        purposeId
        purposeName
        purposeCode
        totalAmount
        totalCount
      }
      byDepartmentGroup {
        departmentId
        departmentName
        departmentCode
        groupId
        groupName
        isTopLevel
        totalAmount
        totalCount
      }
    }
  }
`;

/**
 * Get contributions for a single group (group-admin scoped).
 */
export const GET_GROUP_CONTRIBUTIONS = gql`
  query GetGroupContributions(
    $groupName: String!
    $filters: ContributionFilters
    $pagination: PaginationInput
  ) {
    groupContributions(groupName: $groupName, filters: $filters, pagination: $pagination) {
      items {
        id
        amount
        status
        transactionDate
        notes
        routedGroupName
        purposeName
        contributionGroupId
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

export const GET_MY_GROUP_NAMES = gql`
  query GetMyGroupNames {
    myGroupNames
  }
`;
