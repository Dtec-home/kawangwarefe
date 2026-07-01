/**
 * GraphQL Mutations for Multi-Category Contributions
 */

import { gql } from "@apollo/client";

export const INITIATE_MULTI_CONTRIBUTION = gql`
  mutation InitiateMultiContribution(
    $phoneNumber: String!
    $contributions: [CategoryAmountInput!]!
    $eventId: ID
  ) {
    initiateMultiCategoryContribution(
      phoneNumber: $phoneNumber
      contributions: $contributions
      eventId: $eventId
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
        purposeName
        routedGroupName
      }
      checkoutRequestId
      transactionId
    }
  }
`;
