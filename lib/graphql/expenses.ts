/**
 * Expenses GraphQL operations
 * Sprint: Expenses & UX (W1.4 / W1.5)
 *
 * Money-out tracking. All fields are additive and opt-in per fund — recording
 * expenses never mutates gross contribution figures (see D1 in the sprint plan).
 */

import { gql } from "@apollo/client";

const EXPENSE_FIELDS = `
  id
  amount
  expenseDate
  payee
  description
  paymentMethod
  referenceNumber
  status
  category {
    id
    name
  }
  purpose {
    id
    name
  }
  recordedBy
  approvedBy
  paidBy
  voidReason
  requestedByMe
  canApprove
  canMarkPaid
  attachmentUrl
  createdAt
`;

/**
 * List expenses with optional filters.
 */
export const GET_EXPENSES = gql`
  query GetExpenses(
    $categoryId: ID
    $status: String
    $startDate: String
    $endDate: String
    $limit: Int
    $offset: Int
  ) {
    expenses(
      categoryId: $categoryId
      status: $status
      startDate: $startDate
      endDate: $endDate
      limit: $limit
      offset: $offset
    ) {
      ${EXPENSE_FIELDS}
    }
  }
`;

/**
 * Funds (categories) with expense-tracking settings + live balances.
 */
export const GET_FUNDS_WITH_EXPENSE_SETTINGS = gql`
  query GetFundsWithExpenseSettings($includeInactive: Boolean) {
    contributionCategories(includeInactive: $includeInactive) {
      id
      name
      code
      isActive
      expenseTrackingEnabled
      openingBalance
      openingBalanceDate
      netBalance
      totalExpenses
    }
  }
`;

export const CREATE_EXPENSE = gql`
  mutation CreateExpense(
    $categoryId: ID!
    $amount: String!
    $expenseDate: String!
    $payee: String!
    $description: String
    $paymentMethod: String
    $referenceNumber: String
    $purposeId: ID
    $attachmentUrl: String
    $autoApprove: Boolean
  ) {
    createExpense(
      categoryId: $categoryId
      amount: $amount
      expenseDate: $expenseDate
      payee: $payee
      description: $description
      paymentMethod: $paymentMethod
      referenceNumber: $referenceNumber
      purposeId: $purposeId
      attachmentUrl: $attachmentUrl
      autoApprove: $autoApprove
    ) {
      success
      message
      expense {
        ${EXPENSE_FIELDS}
      }
    }
  }
`;

export const UPDATE_EXPENSE = gql`
  mutation UpdateExpense(
    $id: ID!
    $amount: String
    $expenseDate: String
    $payee: String
    $description: String
    $paymentMethod: String
    $referenceNumber: String
    $purposeId: ID
    $attachmentUrl: String
  ) {
    updateExpense(
      id: $id
      amount: $amount
      expenseDate: $expenseDate
      payee: $payee
      description: $description
      paymentMethod: $paymentMethod
      referenceNumber: $referenceNumber
      purposeId: $purposeId
      attachmentUrl: $attachmentUrl
    ) {
      success
      message
      expense {
        ${EXPENSE_FIELDS}
      }
    }
  }
`;

export const APPROVE_EXPENSE = gql`
  mutation ApproveExpense($id: ID!) {
    approveExpense(id: $id) {
      success
      message
      expense {
        ${EXPENSE_FIELDS}
      }
    }
  }
`;

export const MARK_EXPENSE_PAID = gql`
  mutation MarkExpensePaid($id: ID!) {
    markExpensePaid(id: $id) {
      success
      message
      expense {
        ${EXPENSE_FIELDS}
      }
    }
  }
`;

export const VOID_EXPENSE = gql`
  mutation VoidExpense($id: ID!, $reason: String!) {
    voidExpense(id: $id, reason: $reason) {
      success
      message
      expense {
        ${EXPENSE_FIELDS}
      }
    }
  }
`;

export const UPDATE_FUND_EXPENSE_SETTINGS = gql`
  mutation UpdateFundExpenseSettings(
    $categoryId: ID!
    $expenseTrackingEnabled: Boolean!
    $openingBalance: String
    $openingBalanceDate: String
  ) {
    updateFundExpenseSettings(
      categoryId: $categoryId
      expenseTrackingEnabled: $expenseTrackingEnabled
      openingBalance: $openingBalance
      openingBalanceDate: $openingBalanceDate
    ) {
      success
      message
    }
  }
`;
