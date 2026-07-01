/**
 * Self-service profile queries + mutations (Sprint 1 / E1.1)
 * Paired with backend mutation `updateMemberProfile` and query `me`.
 */

import { gql } from "@apollo/client";

export const GET_ME = gql`
  query GetMe {
    me {
      id
      firstName
      lastName
      phoneNumber
      memberNumber
      email
      isActive
      isGuest
      fullName
      avatarUrl
      department {
        id
        name
        code
        allowedGroups {
          id
          name
        }
      }
      groups {
        id
        name
      }
    }
  }
`;

export const UPDATE_MEMBER_PROFILE = gql`
  mutation UpdateMemberProfile($departmentId: ID, $groupIds: [ID!]) {
    updateMemberProfile(departmentId: $departmentId, groupIds: $groupIds) {
      success
      message
      member {
        id
        fullName
        department {
          id
          name
        }
        groups {
          id
          name
        }
      }
    }
  }
`;
