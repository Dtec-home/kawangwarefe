import { gql } from "@apollo/client";

/**
 * GraphQL operations for church leaders / "About" section.
 */

const LEADER_FIELDS = `
  id
  name
  title
  bio
  photoUrl
  email
  phone
  displayOrder
  isActive
  category {
    id
    name
  }
`;

export const GET_LEADERS = gql`
  query GetLeaders($activeOnly: Boolean) {
    leaders(activeOnly: $activeOnly) {
      ${LEADER_FIELDS}
    }
  }
`;

export const CREATE_LEADER = gql`
  mutation CreateLeader(
    $name: String!
    $title: String!
    $bio: String
    $photoUrl: String
    $email: String
    $phone: String
    $categoryId: ID
    $isActive: Boolean
  ) {
    createLeader(
      name: $name
      title: $title
      bio: $bio
      photoUrl: $photoUrl
      email: $email
      phone: $phone
      categoryId: $categoryId
      isActive: $isActive
    ) {
      success
      message
      leader {
        ${LEADER_FIELDS}
      }
    }
  }
`;

export const UPDATE_LEADER = gql`
  mutation UpdateLeader(
    $leaderId: ID!
    $name: String
    $title: String
    $bio: String
    $photoUrl: String
    $email: String
    $phone: String
    $categoryId: ID
    $isActive: Boolean
  ) {
    updateLeader(
      leaderId: $leaderId
      name: $name
      title: $title
      bio: $bio
      photoUrl: $photoUrl
      email: $email
      phone: $phone
      categoryId: $categoryId
      isActive: $isActive
    ) {
      success
      message
      leader {
        ${LEADER_FIELDS}
      }
    }
  }
`;

export const DELETE_LEADER = gql`
  mutation DeleteLeader($leaderId: ID!) {
    deleteLeader(leaderId: $leaderId) {
      success
      message
    }
  }
`;

export const TOGGLE_LEADER_ACTIVE = gql`
  mutation ToggleLeaderActive($leaderId: ID!) {
    toggleLeaderActive(leaderId: $leaderId) {
      success
      message
      leader {
        ${LEADER_FIELDS}
      }
    }
  }
`;

export const REORDER_LEADERS = gql`
  mutation ReorderLeaders($ids: [ID!]!) {
    reorderLeaders(ids: $ids) {
      success
      message
    }
  }
`;

export interface LeaderCategory {
  id: string;
  name: string;
}

export interface Leader {
  id: string;
  name: string;
  title: string;
  bio: string | null;
  photoUrl: string | null;
  email: string | null;
  phone: string | null;
  displayOrder: number;
  isActive: boolean;
  category: LeaderCategory | null;
}
