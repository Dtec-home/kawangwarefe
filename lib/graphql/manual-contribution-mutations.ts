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
 * sharing one contribution group and one system receipt (`receiptNumber`,
 * YYYYMMDD-NNNN). The `receiptNumber` argument is only a typed old book
 * number. Supports walk-in givers (Ticket 7) via optional phoneNumber + giverName.
 * `idempotencyKey` (T5.3): repeating a key returns the first result with
 * `idempotentReplay: true` instead of recording the gift twice.
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
    $idempotencyKey: String
  ) {
    createManualMultiContribution(
      contributions: $contributions
      phoneNumber: $phoneNumber
      entryType: $entryType
      receiptNumber: $receiptNumber
      transactionDate: $transactionDate
      notes: $notes
      giverName: $giverName
      idempotencyKey: $idempotencyKey
    ) {
      success
      message
      contributionGroupId
      totalAmount
      receiptNumber
      isGuest
      smsSent
      idempotentReplay
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
      giver {
        id
        displayName
      }
    }
  }
`;
