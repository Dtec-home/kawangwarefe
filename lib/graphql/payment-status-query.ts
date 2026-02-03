/**
 * GraphQL Query for Payment Status
 */

import { gql } from "@apollo/client";

export const GET_PAYMENT_STATUS = gql`
  query GetPaymentStatus($checkoutRequestId: String!) {
    paymentStatus(checkoutRequestId: $checkoutRequestId)
  }
`;
