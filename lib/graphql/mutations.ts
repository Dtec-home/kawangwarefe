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
    $purposeId: ID
  ) {
    initiateContribution(
      phoneNumber: $phoneNumber
      amount: $amount
      categoryId: $categoryId
      purposeId: $purposeId
    ) {
      success
      message
      checkoutRequestId
      contribution {
        id
        amount
        status
        transactionDate
        routedGroupName
        purposeName
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
    $categoryIds: [Int!]
    $purposeId: Int
    $groupId: Int
    $routingType: String
    $memberId: Int
  ) {
    generateContributionReport(
      format: $format
      reportType: $reportType
      dateFrom: $dateFrom
      dateTo: $dateTo
      categoryId: $categoryId
      categoryIds: $categoryIds
      purposeId: $purposeId
      groupId: $groupId
      routingType: $routingType
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