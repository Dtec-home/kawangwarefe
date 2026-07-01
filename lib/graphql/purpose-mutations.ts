import { gql } from "@apollo/client";

export const CREATE_DEPARTMENT_PURPOSE = gql`
  mutation CreateDepartmentPurpose(
    $categoryId: ID!
    $name: String!
    $code: String
    $description: String
  ) {
    createDepartmentPurpose(
      categoryId: $categoryId
      name: $name
      code: $code
      description: $description
    ) {
      success
      message
      purpose {
        id
        name
        code
        description
        isActive
      }
    }
  }
`;

export const UPDATE_DEPARTMENT_PURPOSE = gql`
  mutation UpdateDepartmentPurpose(
    $purposeId: ID!
    $name: String
    $code: String
    $description: String
    $isActive: Boolean
  ) {
    updateDepartmentPurpose(
      purposeId: $purposeId
      name: $name
      code: $code
      description: $description
      isActive: $isActive
    ) {
      success
      message
      purpose {
        id
        name
        code
        description
        isActive
      }
    }
  }
`;

export const DELETE_DEPARTMENT_PURPOSE = gql`
  mutation DeleteDepartmentPurpose($purposeId: ID!) {
    deleteDepartmentPurpose(purposeId: $purposeId) {
      success
      message
    }
  }
`;
