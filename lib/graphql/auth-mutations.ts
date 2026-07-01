/**
 * Authentication GraphQL Mutations
 * Sprint 2: Authentication & Member Dashboard
 */

import { gql } from "@apollo/client";

/**
 * Request OTP for phone-based authentication
 */
export const REQUEST_OTP = gql`
  mutation RequestOtp($phoneNumber: String!) {
    requestOtp(phoneNumber: $phoneNumber) {
      success
      message
      expiresInMinutes
      otpCode
    }
  }
`;

/**
 * Verify OTP and get JWT tokens
 */
export const VERIFY_OTP = gql`
  mutation VerifyOtp($phoneNumber: String!, $otpCode: String!) {
    verifyOtp(phoneNumber: $phoneNumber, otpCode: $otpCode) {
      success
      message
      accessToken
      refreshToken
      userId
      memberId
      phoneNumber
      fullName
      isNewMember
    }
  }
`;

/**
 * Complete self-registration (name, department, group)
 */
export const COMPLETE_REGISTRATION = gql`
  mutation CompleteRegistration(
    $firstName: String!
    $lastName: String!
    $departmentId: ID
    $groupId: ID
  ) {
    completeRegistration(
      firstName: $firstName
      lastName: $lastName
      departmentId: $departmentId
      groupId: $groupId
    ) {
      success
      message
      member {
        id
        firstName
        lastName
        fullName
        isGuest
      }
    }
  }
`;

/**
 * Fetch departments and groups for registration form
 */
export const REGISTRATION_OPTIONS = gql`
  query RegistrationOptions {
    registrationDepartments {
      id
      name
      description
    }
    registrationGroups {
      id
      name
    }
  }
`;

/**
 * Refresh access token
 */
export const REFRESH_TOKEN = gql`
  mutation RefreshToken($refreshToken: String!) {
    refreshToken(refreshToken: $refreshToken) {
      success
      message
      accessToken
    }
  }
`;

/**
 * Logout user
 */
export const LOGOUT = gql`
  mutation Logout($refreshToken: String!) {
    logout(refreshToken: $refreshToken) {
      success
      message
    }
  }
`;
