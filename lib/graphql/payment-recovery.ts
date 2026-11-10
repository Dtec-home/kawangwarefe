/** Recovering a reported M-Pesa payment (W1, F1). Backend: apikawangware#98. */
import { gql } from "@apollo/client";

export const FIND_MPESA_PAYMENT = gql`
  mutation FindMpesaPayment($code: String!) {
    findMpesaPayment(code: $code) {
      success
      message
      status
    }
  }
`;

export const MPESA_STATUS_QUERIES = gql`
  query MpesaStatusQueries($limit: Int!) {
    mpesaStatusQueries(limit: $limit) {
      transId
      status
      resultDesc
      createdAt
    }
  }
`;
