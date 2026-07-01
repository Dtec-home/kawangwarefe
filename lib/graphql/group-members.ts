import { gql } from "@apollo/client";

export const GET_GROUP_MEMBERS = gql`
  query GetGroupMembers($groupId: ID!) {
    group(id: $groupId) {
      id
      name
      members {
        id
        fullName
        phoneNumber
        email
      }
    }
  }
`;
