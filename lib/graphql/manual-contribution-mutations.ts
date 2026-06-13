import { gql } from '@apollo/client';

export const CREATE_MANUAL_CONTRIBUTION = gql`
  mutation CreateManualContribution(
    $phoneNumber: String
    $amount: String!
    $categoryId: ID!
    $purposeId: ID
    $entryType: String
    $receiptNumber: String
    $transactionDate: String
    $notes: String
    $giverName: String
  ) {
    createManualContribution(
      phoneNumber: $phoneNumber
      amount: $amount
      categoryId: $categoryId
      purposeId: $purposeId
      entryType: $entryType
      receiptNumber: $receiptNumber
      transactionDate: $transactionDate
      notes: $notes
      giverName: $giverName
    ) {
      success
      message
      contribution {
        id
        amount
        entryType
        manualReceiptNumber
        transactionDate
        status
        member {
          id
          fullName
          phoneNumber
          memberNumber
          isGuest
        }
        category {
          id
          name
          code
        }
      }
    }
  }
`;

/**
 * Multi-category manual entry (Ticket 6): one Contribution per line item,
 * sharing one receipt number / contribution group. Supports walk-in givers
 * (Ticket 7) via optional phoneNumber + giverName.
 */
export const CREATE_MANUAL_MULTI_CONTRIBUTION = gql`
  mutation CreateManualMultiContribution(
    $contributions: [ManualCategoryAmountInput!]!
    $phoneNumber: String
    $entryType: String
    $receiptNumber: String
    $transactionDate: String
    $notes: String
    $giverName: String
  ) {
    createManualMultiContribution(
      contributions: $contributions
      phoneNumber: $phoneNumber
      entryType: $entryType
      receiptNumber: $receiptNumber
      transactionDate: $transactionDate
      notes: $notes
      giverName: $giverName
    ) {
      success
      message
      contributionGroupId
      totalAmount
      receiptNumber
      isGuest
      smsSent
    }
  }
`;

/**
 * Preview the next auto-assigned manual book-receipt number (Ticket 9)
 * without consuming it. Shown as a read-only hint on the manual entry form.
 */
export const GET_NEXT_RECEIPT_NUMBER = gql`
  query GetNextReceiptNumber {
    nextReceiptNumber {
      prefix
      nextNumber
      padding
      nextReceiptNumber
    }
  }
`;

/**
 * Admin-only: set/reset the starting number, prefix and padding of the
 * global auto-incrementing manual receipt sequence (Ticket 9).
 */
export const SET_RECEIPT_SEQUENCE = gql`
  mutation SetReceiptSequence($nextNumber: Int, $prefix: String, $padding: Int) {
    setReceiptSequence(nextNumber: $nextNumber, prefix: $prefix, padding: $padding) {
      success
      message
      sequence {
        prefix
        nextNumber
        padding
        nextReceiptNumber
      }
    }
  }
`;

export const ATTACH_BOOK_RECEIPT_NUMBER = gql`
  mutation AttachBookReceiptNumber($contributionId: ID!, $receiptNumber: String!) {
    attachBookReceiptNumber(contributionId: $contributionId, receiptNumber: $receiptNumber) {
      success
      message
      contribution {
        id
        manualReceiptNumber
      }
    }
  }
`;

export const LOOKUP_MEMBER_BY_PHONE = gql`
  mutation LookupMemberByPhone($phoneNumber: String!) {
    lookupMemberByPhone(phoneNumber: $phoneNumber) {
      success
      found
      message
      isGuest
      phoneNumber
      member {
        id
        fullName
        firstName
        lastName
        phoneNumber
        memberNumber
        email
        isGuest
        isActive
      }
    }
  }
`;
