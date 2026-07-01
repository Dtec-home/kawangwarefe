/**
 * Prayer request GraphQL (Sprint 7 / Epic E5).
 * Submission is open to any visitor (anonymous allowed when visibility
 * is public/team). Moderation queries are staff-only.
 */

import { gql } from '@apollo/client';

const PRAYER_FIELDS = gql`
  fragment PrayerFields on PrayerRequestType {
    id
    title
    body
    status
    visibility
    isAnonymous
    createdAt
    updatedAt
    requesterDisplayName
  }
`;

export const SUBMIT_PRAYER_REQUEST = gql`
  ${PRAYER_FIELDS}
  mutation SubmitPrayerRequest(
    $title: String!
    $body: String!
    $isAnonymous: Boolean
    $visibility: String
  ) {
    submitPrayerRequest(
      title: $title
      body: $body
      isAnonymous: $isAnonymous
      visibility: $visibility
    ) {
      success
      message
      request {
        ...PrayerFields
      }
    }
  }
`;

export const UPDATE_PRAYER_REQUEST_STATUS = gql`
  ${PRAYER_FIELDS}
  mutation UpdatePrayerRequestStatus($requestId: ID!, $newStatus: String!) {
    updatePrayerRequestStatus(requestId: $requestId, newStatus: $newStatus) {
      success
      message
      request {
        ...PrayerFields
      }
    }
  }
`;

export const GET_MY_PRAYER_REQUESTS = gql`
  ${PRAYER_FIELDS}
  query GetMyPrayerRequests {
    myPrayerRequests {
      ...PrayerFields
    }
  }
`;

export const GET_PRAYER_REQUESTS = gql`
  ${PRAYER_FIELDS}
  query GetPrayerRequests($status: String) {
    prayerRequests(status: $status) {
      ...PrayerFields
    }
  }
`;
