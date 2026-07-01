import { gql } from '@apollo/client';

export const UPDATE_TUTORIAL_STATUS = gql`
  mutation UpdateTutorialStatus($tutorialKey: String!, $completed: Boolean!) {
    updateTutorialStatus(tutorialKey: $tutorialKey, completed: $completed) {
      success
      message
      tutorialState {
        id
        completedTutorials
        updatedAt
      }
    }
  }
`;

export const RESET_ALL_TUTORIALS = gql`
  mutation ResetAllTutorials {
    resetAllTutorials {
      success
      message
      tutorialState {
        id
        completedTutorials
        updatedAt
      }
    }
  }
`;
