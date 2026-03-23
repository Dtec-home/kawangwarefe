import { gql } from "@apollo/client";

export const GET_GROUPS_LIST = gql`
  query GetGroupsList {
    groupsList {
      id
      name
    }
  }
`;

export const CREATE_GROUP = gql`
  mutation CreateGroup($name: String!) {
    createGroup(name: $name) {
      success
      message
      group {
        id
        name
      }
    }
  }
`;

export const UPDATE_GROUP = gql`
  mutation UpdateGroup($groupId: ID!, $name: String!) {
    updateGroup(groupId: $groupId, name: $name) {
      success
      message
      group {
        id
        name
      }
    }
  }
`;

export const DELETE_GROUP = gql`
  mutation DeleteGroup($groupId: ID!) {
    deleteGroup(groupId: $groupId) {
      success
      message
    }
  }
`;
