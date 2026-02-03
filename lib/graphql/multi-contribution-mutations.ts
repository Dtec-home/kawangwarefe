/**
 * GraphQL Mutations for Multi-Category Contributions
 */

import { gql } from "@apollo/client";

export const INITIATE_MULTI_CONTRIBUTION = gql`
  mutation InitiateMultiContribution(
    $phoneNumber: String!
    $contributions: [CategoryAmountInput!]!
  ) {
    initiateMultiCategoryContribution(
      phoneNumber: $phoneNumber
      contributions: $contributions
    ) {
      success
      message
      totalAmount
      contributionGroupId
      contributions {
        categoryId
        categoryName
        categoryCode
        amount
      }
      checkoutRequestId
      transactionId
    }
  }
`;
