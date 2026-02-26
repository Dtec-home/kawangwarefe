/**
 * C2B Transaction GraphQL Operations
 * Admin queries and mutations for Pay Bill (C2B) transaction management
 */

import { gql } from "@apollo/client";

/**
 * Get C2B transactions with filters and pagination
 */
export const GET_C2B_TRANSACTIONS = gql`
  query GetC2BTransactions(
    $status: String
    $dateFrom: DateTime
    $dateTo: DateTime
    $pagination: PaginationInput
  ) {
    c2bTransactions(
      status: $status
      dateFrom: $dateFrom
      dateTo: $dateTo
      pagination: $pagination
    ) {
      items {
        id
        transId
        transTime
        transAmount
        billRefNumber
        msisdn
        customerName
        firstName
        middleName
        lastName
        status
        matchedCategoryCode
        matchMethod
        createdAt
      }
      total
      hasMore
    }
  }
`;

/**
 * Get aggregate statistics for C2B transactions
 */
export const GET_C2B_TRANSACTION_STATS = gql`
  query GetC2BTransactionStats($dateFrom: DateTime, $dateTo: DateTime) {
    c2bTransactionStats(dateFrom: $dateFrom, dateTo: $dateTo) {
      totalAmount
      totalCount
      processedCount
      unmatchedCount
      failedCount
    }
  }
`;

/**
 * Resolve an unmatched C2B transaction by assigning a category
 */
export const RESOLVE_UNMATCHED_C2B = gql`
  mutation ResolveUnmatchedC2b($transactionId: ID!, $categoryId: ID!) {
    resolveUnmatchedC2b(transactionId: $transactionId, categoryId: $categoryId) {
      success
      message
      transaction {
        id
        status
        matchedCategoryCode
        matchMethod
      }
      contribution {
        id
        amount
        status
      }
    }
  }
`;
