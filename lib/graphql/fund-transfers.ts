/**
 * Fund transfers (FT-2) and moving a gift (RA-2) GraphQL documents.
 *
 * Hand-written against the live schema (treasury/api/transfers.py,
 * contributions/reallocation_api.py). Transfer mutations return the
 * `FundTransferResult` union, resolved through `__typename`
 * (`isFundTransferError` in lib/fund-transfers/logic.ts).
 */

import { gql, type TypedDocumentNode } from "@apollo/client";

import type {
  FundTransfer,
  FundTransferInput,
  FundTransferResult,
  ReallocationPreview,
  ReallocationTargetInput,
} from "@/lib/fund-transfers/types";

export const FUND_TRANSFER_FIELDS = gql`
  fragment FundTransferFields on FundTransfer {
    id
    fromDepartment {
      id
      name
      code
    }
    fromPurpose {
      id
      name
      code
    }
    toDepartment {
      id
      name
      code
    }
    toPurpose {
      id
      name
      code
    }
    amount
    transferDate
    reason
    status
    requestedBy
    decidedBy
    decidedAt
    decisionNote
    canApprove
    canCancel
  }
`;

const TRANSFER_RESULT = `
  __typename
  ... on FundTransfer {
    ...FundTransferFields
  }
  ... on FundTransferError {
    code
    message
  }
`;

export const GET_FUND_TRANSFERS: TypedDocumentNode<
  { fundTransfers: FundTransfer[] },
  { status: string | null; departmentId: string | null }
> = gql`
  query GetFundTransfers($status: String, $departmentId: ID) {
    fundTransfers(status: $status, departmentId: $departmentId) {
      ...FundTransferFields
    }
  }
  ${FUND_TRANSFER_FIELDS}
`;

export const GET_FUND_AVAILABLE_BALANCE: TypedDocumentNode<
  { fundAvailableBalance: string },
  { departmentId: string; purposeId: string | null; onDate: string | null }
> = gql`
  query GetFundAvailableBalance($departmentId: ID!, $purposeId: ID, $onDate: Date) {
    fundAvailableBalance(departmentId: $departmentId, purposeId: $purposeId, onDate: $onDate)
  }
`;

export const REQUEST_FUND_TRANSFER: TypedDocumentNode<
  { requestFundTransfer: FundTransferResult },
  { input: FundTransferInput }
> = gql`
  mutation RequestFundTransfer($input: FundTransferInput!) {
    requestFundTransfer(input: $input) {
      ${TRANSFER_RESULT}
    }
  }
  ${FUND_TRANSFER_FIELDS}
`;

export const APPROVE_FUND_TRANSFER: TypedDocumentNode<
  { approveFundTransfer: FundTransferResult },
  { id: string; note?: string | null }
> = gql`
  mutation ApproveFundTransfer($id: ID!, $note: String) {
    approveFundTransfer(id: $id, note: $note) {
      ${TRANSFER_RESULT}
    }
  }
  ${FUND_TRANSFER_FIELDS}
`;

export const REJECT_FUND_TRANSFER: TypedDocumentNode<
  { rejectFundTransfer: FundTransferResult },
  { id: string; note: string }
> = gql`
  mutation RejectFundTransfer($id: ID!, $note: String!) {
    rejectFundTransfer(id: $id, note: $note) {
      ${TRANSFER_RESULT}
    }
  }
  ${FUND_TRANSFER_FIELDS}
`;

export const CANCEL_FUND_TRANSFER: TypedDocumentNode<
  { cancelFundTransfer: FundTransferResult },
  { id: string }
> = gql`
  mutation CancelFundTransfer($id: ID!) {
    cancelFundTransfer(id: $id) {
      ${TRANSFER_RESULT}
    }
  }
  ${FUND_TRANSFER_FIELDS}
`;

const PREVIEW_FIELDS = `
  ok
  code
  message
  total
  before {
    department
    purpose
    amount
  }
  after {
    department
    purpose
    amount
  }
`;

export const PREVIEW_PAYMENT_REALLOCATION: TypedDocumentNode<
  { previewPaymentReallocation: ReallocationPreview },
  { contributionGroupId: string; targets: ReallocationTargetInput[] }
> = gql`
  query PreviewPaymentReallocation($contributionGroupId: ID!, $targets: [ReallocationTargetInput!]!) {
    previewPaymentReallocation(contributionGroupId: $contributionGroupId, targets: $targets) {
      ${PREVIEW_FIELDS}
    }
  }
`;

export const REALLOCATE_PAYMENT: TypedDocumentNode<
  { reallocatePayment: ReallocationPreview },
  { contributionGroupId: string; targets: ReallocationTargetInput[]; reason: string }
> = gql`
  mutation ReallocatePayment($contributionGroupId: ID!, $targets: [ReallocationTargetInput!]!, $reason: String!) {
    reallocatePayment(contributionGroupId: $contributionGroupId, targets: $targets, reason: $reason) {
      ${PREVIEW_FIELDS}
    }
  }
`;

/** Every completed line of one payment (the Move gift dialog's starting point). */
export const GET_PAYMENT_LINES = gql`
  query GetPaymentLines($contributionGroupId: ID!) {
    paymentLines(contributionGroupId: $contributionGroupId) {
      departmentId
      department
      purposeId
      purpose
      amount
    }
  }
`;
