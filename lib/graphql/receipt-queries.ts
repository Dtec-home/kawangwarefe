/**
 * Receipts (Treasury Digital Books T1.6 / T1.5 / T2.6).
 * Field names mirror api_schema/receipt_types.py, receipt_queries.py and
 * receipt_mutations.py (Strawberry camelCase).
 */

import { gql } from "@apollo/client";

export const RECEIPT_FIELDS = gql`
  fragment ReceiptFields on ReceiptType {
    id
    number
    receiptDate
    channel
    status
    totalAmount
    giverName
    memberName
    issuedByName
    legacyBookNumber
    mpesaCode
    voidedAt
    voidReason
    createdAt
    lines {
      id
      categoryName
      purposeName
      amount
    }
  }
`;

/** The receipt register — staff only. */
export const GET_RECEIPTS = gql`
  query GetReceipts($filter: ReceiptFilterInput, $limit: Int, $offset: Int) {
    receipts(filter: $filter, limit: $limit, offset: $offset) {
      totalCount
      items {
        ...ReceiptFields
      }
    }
  }
  ${RECEIPT_FIELDS}
`;

/** One receipt; null when missing or not visible to the caller. */
export const GET_RECEIPT = gql`
  query GetReceipt($number: String!) {
    receipt(number: $number) {
      ...ReceiptFields
    }
    churchProfile {
      displayName
    }
  }
  ${RECEIPT_FIELDS}
`;

/** Receipt void requests — admin/treasurer only. */
export const GET_VOID_REQUESTS = gql`
  query GetVoidRequests($status: String) {
    voidRequests(status: $status) {
      id
      requestedByName
      reason
      status
      decidedByName
      decidedAt
      decisionNote
      createdAt
      receipt {
        id
        number
        receiptDate
        channel
        status
        totalAmount
        giverName
        memberName
      }
    }
  }
`;

/** Pending void requests, for the nav badge. */
export const GET_PENDING_VOID_REQUEST_COUNT = gql`
  query GetPendingVoidRequestCount {
    voidRequests(status: "pending") {
      id
    }
  }
`;

export const VOID_RECEIPT = gql`
  mutation VoidReceipt($receiptId: ID!, $reason: String!) {
    voidReceipt(receiptId: $receiptId, reason: $reason) {
      success
      message
      receiptNumber
      status
    }
  }
`;

export const DECIDE_VOID_REQUEST = gql`
  mutation DecideVoidRequest($requestId: ID!, $approve: Boolean!, $note: String) {
    decideVoidRequest(requestId: $requestId, approve: $approve, note: $note) {
      success
      message
      receiptNumber
      status
    }
  }
`;

export type ReceiptChannel = "manual" | "cash" | "envelope" | "mpesa_stk" | "mpesa_c2b";
export type ReceiptStatus = "issued" | "void";
export type VoidRequestStatus = "pending" | "approved" | "rejected";

export interface ReceiptLine {
  id: string;
  categoryName: string;
  purposeName: string | null;
  amount: string;
}

export interface Receipt {
  id: string;
  number: string;
  /** ISO date (YYYY-MM-DD), Nairobi day of the gift */
  receiptDate: string;
  channel: ReceiptChannel | string;
  status: ReceiptStatus | string;
  totalAmount: string;
  giverName: string | null;
  memberName: string | null;
  issuedByName: string | null;
  legacyBookNumber: string | null;
  mpesaCode: string | null;
  voidedAt: string | null;
  voidReason: string;
  createdAt: string;
  lines: ReceiptLine[];
}

export interface ReceiptFilterInput {
  dateFrom?: string | null;
  dateTo?: string | null;
  channel?: string | null;
  status?: string | null;
  issuedById?: string | null;
  search?: string | null;
}

export interface ReceiptsData {
  receipts: { totalCount: number; items: Receipt[] };
}

export interface ReceiptsVars {
  filter?: ReceiptFilterInput | null;
  limit?: number;
  offset?: number;
}

export interface ReceiptData {
  receipt: Receipt | null;
  churchProfile: { displayName: string } | null;
}

export interface VoidRequest {
  id: string;
  requestedByName: string | null;
  reason: string;
  status: VoidRequestStatus | string;
  decidedByName: string | null;
  decidedAt: string | null;
  decisionNote: string;
  createdAt: string;
  receipt: Pick<
    Receipt,
    "id" | "number" | "receiptDate" | "channel" | "status" | "totalAmount" | "giverName" | "memberName"
  >;
}

export interface VoidRequestsData {
  voidRequests: VoidRequest[];
}

export interface PendingVoidRequestCountData {
  voidRequests: { id: string }[];
}

export interface ReceiptVoidResponse {
  success: boolean;
  message: string;
  receiptNumber: string | null;
  status: string | null;
}

export interface VoidReceiptData {
  voidReceipt: ReceiptVoidResponse;
}

export interface VoidReceiptVars {
  receiptId: string;
  reason: string;
}

export interface DecideVoidRequestData {
  decideVoidRequest: ReceiptVoidResponse;
}

export interface DecideVoidRequestVars {
  requestId: string;
  approve: boolean;
  note: string | null;
}
