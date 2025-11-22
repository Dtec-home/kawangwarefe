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