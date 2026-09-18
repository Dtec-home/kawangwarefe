import { gql } from "@apollo/client";

/**
 * Admin purposes list: includes the Cash Statement trust/local override,
 * which member-facing screens (GET_DEPARTMENT_PURPOSES) don't need.
 * trustFundOverride: null = inherit from department, true = own trust
 * column, false = own local column.
 */
export const GET_ADMIN_DEPARTMENT_PURPOSES = gql`
  query GetAdminDepartmentPurposes($categoryId: ID!, $isActive: Boolean) {
    departmentPurposes(categoryId: $categoryId, isActive: $isActive) {
      id
      name
      code
      description
      isActive
      trustFundOverride
    }
  }
`;

export const CREATE_DEPARTMENT_PURPOSE = gql`
  mutation CreateDepartmentPurpose(
    $categoryId: ID!
    $name: String!
    $code: String
    $description: String
    $trustFundOverride: Boolean
  ) {
    createDepartmentPurpose(
      categoryId: $categoryId
      name: $name
      code: $code
      description: $description
      trustFundOverride: $trustFundOverride
    ) {
      success
      message
      purpose {
        id
        name
        code
        description
        isActive
        trustFundOverride
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
    $trustFundOverride: Boolean
  ) {
    updateDepartmentPurpose(
      purposeId: $purposeId
      name: $name
      code: $code
      description: $description
      isActive: $isActive
      trustFundOverride: $trustFundOverride
    ) {
      success
      message
      purpose {
        id
        name
        code
        description
        isActive
        trustFundOverride
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
