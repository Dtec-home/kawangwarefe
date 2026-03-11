/**
 * GraphQL Query & Mutation for Payment Status
 */

import { gql } from "@apollo/client";

export const GET_PAYMENT_STATUS = gql`
  query GetPaymentStatus($checkoutRequestId: String!) {
    paymentStatus(checkoutRequestId: $checkoutRequestId)
  }
`;

/**
 * Manually check payment status via M-Pesa STK Query API.
 * Used when the callback was missed (e.g. ngrok was down).
 */
export const CHECK_PAYMENT_STATUS = gql`
  mutation CheckPaymentStatus($checkoutRequestId: String!) {
    checkPaymentStatus(checkoutRequestId: $checkoutRequestId) {
      success
      message
      status
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
        }
        mpesaTransaction {
          id
          mpesaReceiptNumber
          status
          resultDesc
        }
      }
    }
  }
`;

/**
 * Get all contributions linked to a checkout request ID.
 * Used by the confirmation page for multi-category contributions.
 */
export const GET_CONTRIBUTIONS_BY_CHECKOUT_ID = gql`
  query GetContributionsByCheckoutId($checkoutRequestId: String!) {
    contributionsByCheckoutId(checkoutRequestId: $checkoutRequestId) {
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
      }
      mpesaTransaction {
        id
        mpesaReceiptNumber
        status
        resultDesc
      }
    }
  }
`;
