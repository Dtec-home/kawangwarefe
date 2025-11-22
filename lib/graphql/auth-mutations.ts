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
