import { gql } from '@apollo/client';

const MEMBER_FIELDS = gql`
  fragment MemberFields on MemberType {
    id
    firstName
    lastName
    phoneNumber
    email
    memberNumber
    isActive
    isGuest
    fullName
    roles
    groups {
      id
      name
    }
    departmentIdentifiers {
      identifier
      category {
        id
        name
      }
    }
  }
`;

export const CREATE_MEMBER = gql`
  ${MEMBER_FIELDS}
  mutation CreateMember(
    $firstName: String!
    $lastName: String!
    $phoneNumber: String!
    $email: String
    $roleNames: [String!]
    $groupIds: [ID!]
  ) {
    createMember(
      firstName: $firstName
      lastName: $lastName
      phoneNumber: $phoneNumber
      email: $email
      roleNames: $roleNames
      groupIds: $groupIds
    ) {
      success
      message
      member {
        ...MemberFields
      }
    }
  }
`;

export const UPDATE_MEMBER = gql`
  ${MEMBER_FIELDS}
  mutation UpdateMember(
    $memberId: ID!
    $firstName: String
    $lastName: String
    $email: String
    $phoneNumber: String
  ) {
    updateMember(
      memberId: $memberId
      firstName: $firstName
      lastName: $lastName
      email: $email
      phoneNumber: $phoneNumber
    ) {
      success
      message
      member {
        ...MemberFields
      }
    }
  }
`;

export const TOGGLE_MEMBER_STATUS = gql`
  mutation ToggleMemberStatus($memberId: ID!) {
    toggleMemberStatus(memberId: $memberId) {
      success
      message
      member {
        id
        isActive
        fullName
      }
    }
  }
`;

export const DELETE_MEMBER = gql`
  mutation DeleteMember($memberId: ID!) {
    deleteMember(memberId: $memberId) {
      success
      message
    }
  }
`;

export const ASSIGN_ROLE = gql`
  ${MEMBER_FIELDS}
  mutation AssignRole($memberId: ID!, $role: String!) {
    assignRole(memberId: $memberId, role: $role) {
      success
      message
      member {
        ...MemberFields
      }
    }
  }
`;

export const REMOVE_ROLE = gql`
  ${MEMBER_FIELDS}
  mutation RemoveRole($memberId: ID!, $role: String!) {
    removeRole(memberId: $memberId, role: $role) {
      success
      message
      member {
        ...MemberFields
      }
    }
  }
`;

export const SET_MEMBER_GROUPS = gql`
  ${MEMBER_FIELDS}
  mutation SetMemberGroups($memberId: ID!, $groupIds: [ID!]!) {
    setMemberGroups(memberId: $memberId, groupIds: $groupIds) {
      success
      message
      member {
        ...MemberFields
      }
    }
  }
`;

export const SET_MEMBER_DEPARTMENT_IDENTIFIER = gql`
  ${MEMBER_FIELDS}
  mutation SetMemberDepartmentIdentifier($memberId: ID!, $categoryId: ID!, $identifier: String!) {
    setMemberDepartmentIdentifier(memberId: $memberId, categoryId: $categoryId, identifier: $identifier) {
      success
      message
      member {
        ...MemberFields
      }
    }
  }
`;

export const REMOVE_MEMBER_DEPARTMENT_IDENTIFIER = gql`
  ${MEMBER_FIELDS}
  mutation RemoveMemberDepartmentIdentifier($memberId: ID!, $categoryId: ID!) {
    removeMemberDepartmentIdentifier(memberId: $memberId, categoryId: $categoryId) {
      success
      message
      member {
        ...MemberFields
      }
    }
  }
`;
