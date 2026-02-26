import { gql } from '@apollo/client';

export const UPDATE_MEMBER = gql`
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
        id
        firstName
        lastName
        phoneNumber
        email
        memberNumber
        isActive
        isGuest
        fullName
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
