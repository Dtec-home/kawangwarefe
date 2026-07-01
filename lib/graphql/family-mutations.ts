/**
 * Family / guardianship GraphQL defs (Sprint 3 / Epic E2).
 * Paired with backend `addChild` mutation and `myDependents` query.
 */

import { gql } from "@apollo/client";

export const GET_MY_DEPENDENTS = gql`
  query GetMyDependents {
    myDependents {
      id
      firstName
      lastName
      fullName
      isMinor
      dateOfBirth
      memberNumber
    }
  }
`;

export const ADD_CHILD = gql`
  mutation AddChild(
    $firstName: String!
    $lastName: String!
    $dateOfBirth: String
  ) {
    addChild(
      firstName: $firstName
      lastName: $lastName
      dateOfBirth: $dateOfBirth
    ) {
      success
      message
      member {
        id
        firstName
        lastName
        fullName
        isMinor
        dateOfBirth
        memberNumber
      }
    }
  }
`;
