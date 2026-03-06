/**
 * GraphQL Query for Payment Status
 */

import { gql } from "@apollo/client";

export const GET_PAYMENT_STATUS = gql`
  query GetPaymentStatus($checkoutRequestId: String!) {
    paymentStatus(checkoutRequestId: $checkoutRequestId)
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
