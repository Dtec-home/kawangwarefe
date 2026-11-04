/**
 * A member's phone numbers (MP-2, MEMBER_IDENTITY/02_CONTRACTS.md §1).
 */

import { gql } from "@apollo/client";

const PHONE_FIELDS = gql`
  fragment MemberPhoneFields on MemberPhoneType {
    id
    phoneNumber
    label
    isPrimary
    verified
    source
    createdAt
  }
`;

const RESULT = `
  success
  message
  code
  conflictMemberId
  conflictMemberName
  member {
    id
    phoneNumber
    phones {
      ...MemberPhoneFields
    }
  }
`;

export const MEMBER_PHONES = gql`
  ${PHONE_FIELDS}
  query MemberPhones($memberId: ID!) {
    memberPhones(memberId: $memberId) {
      ...MemberPhoneFields
    }
  }
`;

export const REQUEST_ADD_PHONE = gql`
  ${PHONE_FIELDS}
  mutation RequestAddPhone($phoneNumber: String!, $label: String) {
    requestAddPhone(phoneNumber: $phoneNumber, label: $label) {${RESULT}}
  }
`;

export const CONFIRM_ADD_PHONE = gql`
  ${PHONE_FIELDS}
  mutation ConfirmAddPhone($phoneNumber: String!, $otpCode: String!, $label: String) {
    confirmAddPhone(phoneNumber: $phoneNumber, otpCode: $otpCode, label: $label) {${RESULT}}
  }
`;

export const ADMIN_ADD_MEMBER_PHONE = gql`
  ${PHONE_FIELDS}
  mutation AdminAddMemberPhone($memberId: ID!, $phoneNumber: String!, $label: String) {
    adminAddMemberPhone(memberId: $memberId, phoneNumber: $phoneNumber, label: $label) {${RESULT}}
  }
`;

export const REMOVE_MEMBER_PHONE = gql`
  ${PHONE_FIELDS}
  mutation RemoveMemberPhone($phoneId: ID!) {
    removeMemberPhone(phoneId: $phoneId) {${RESULT}}
  }
`;

export const SET_PRIMARY_PHONE = gql`
  ${PHONE_FIELDS}
  mutation SetPrimaryPhone($phoneId: ID!) {
    setPrimaryPhone(phoneId: $phoneId) {${RESULT}}
  }
`;
