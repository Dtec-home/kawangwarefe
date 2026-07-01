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

export const BULK_ADD_MEMBERS_TO_GROUP = gql`
  mutation BulkAddMembersToGroup($memberIds: [ID!]!, $groupId: ID!) {
    bulkAddMembersToGroup(memberIds: $memberIds, groupId: $groupId) {
      success
      message
      addedCount
      alreadyMemberCount
      skippedCount
      skippedMembers
    }
  }
`;

export const REMOVE_MEMBER_FROM_GROUP = gql`
  mutation RemoveMemberFromGroup($memberId: ID!, $groupId: ID!) {
    removeMemberFromGroup(memberId: $memberId, groupId: $groupId) {
      success
      message
      group {
        id
        name
      }
    }
  }
`;
