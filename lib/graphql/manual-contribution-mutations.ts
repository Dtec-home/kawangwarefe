import { gql } from '@apollo/client';

export const CREATE_MANUAL_CONTRIBUTION = gql`
  mutation CreateManualContribution(
    $phoneNumber: String!
    $amount: String!
    $categoryId: ID!
    $entryType: String
    $receiptNumber: String
    $transactionDate: String
    $notes: String
  ) {
    createManualContribution(
      phoneNumber: $phoneNumber
      amount: $amount
      categoryId: $categoryId
      entryType: $entryType
      receiptNumber: $receiptNumber
      transactionDate: $transactionDate
      notes: $notes
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
