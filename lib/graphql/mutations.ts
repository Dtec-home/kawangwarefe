/**
 * GraphQL Mutations
 * Following DRY: Centralized mutation definitions
 */

import { gql } from "@apollo/client";

/**
 * Initiate a contribution via M-Pesa STK Push
 */
export const INITIATE_CONTRIBUTION = gql`
  mutation InitiateContribution(
    $phoneNumber: String!
    $amount: String!
    $categoryId: ID!
  ) {
    initiateContribution(
      phoneNumber: $phoneNumber
      amount: $amount
      categoryId: $categoryId
    ) {
      success
      message
      checkoutRequestId
      contribution {
        id
        amount
        status
        transactionDate
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
          checkoutRequestId
          status
        }
      }
    }
  }
`;

/**
 * Generate contribution report
 * Requires staff permissions
 */
export const GENERATE_CONTRIBUTION_REPORT = gql`
  mutation GenerateContributionReport(
    $format: String!
    $reportType: String!
    $dateFrom: DateTime
    $dateTo: DateTime
    $categoryId: Int
    $memberId: Int
  ) {
    generateContributionReport(
      format: $format
      reportType: $reportType
      dateFrom: $dateFrom
      dateTo: $dateTo
      categoryId: $categoryId
      memberId: $memberId
    ) {
      success
      message
      fileData
      filename
      contentType
    }
  }
`;