import { gql } from "@apollo/client";

export const CREATE_PURPOSE_ALLOCATION = gql`
  mutation CreatePurposeAllocation(
    $categoryId: ID!
    $purposeId: ID!
    $percentage: String!
  ) {
    createPurposeAllocation(
      categoryId: $categoryId
      purposeId: $purposeId
      percentage: $percentage
    ) {
      success
      message
      allocation {
        id
        percentage
        isActive
        purpose {
          id
          name
          code
        }
      }
    }
  }
`;

export const UPDATE_PURPOSE_ALLOCATION = gql`
  mutation UpdatePurposeAllocation(
    $allocationId: ID!
    $percentage: String
    $isActive: Boolean
  ) {
    updatePurposeAllocation(
      allocationId: $allocationId
      percentage: $percentage
      isActive: $isActive
    ) {
      success
      message
      allocation {
        id
        percentage
        isActive
        purpose {
          id
          name
          code
        }
      }
    }
  }
`;

export const DELETE_PURPOSE_ALLOCATION = gql`
  mutation DeletePurposeAllocation($allocationId: ID!) {
    deletePurposeAllocation(allocationId: $allocationId) {
      success
      message
    }
  }
`;
