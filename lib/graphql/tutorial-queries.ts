import { gql } from '@apollo/client';

export const GET_TUTORIAL_STATE = gql`
  query GetTutorialState($tutorialKey: String!) {
    isTutorialCompleted(tutorialKey: $tutorialKey)
  }
`;

export const GET_MY_TUTORIAL_STATE = gql`
  query GetMyTutorialState {
    myTutorialState {
      id
      completedTutorials
      createdAt
      updatedAt
    }
  }
`;
