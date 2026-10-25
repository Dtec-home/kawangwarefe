/**
 * Recorder workspace (Treasury Digital Books T2.5, RR-5/RR-6).
 * Field names mirror api_schema/receipt_self_service.py (Strawberry camelCase).
 */

import { gql } from "@apollo/client";
import { RECEIPT_FIELDS, type Receipt } from "@/lib/graphql/receipt-queries";

/** Receipts the caller issued on a Nairobi date (default today). */
export const GET_MY_RECORDED_RECEIPTS = gql`
  query MyRecordedReceipts($date: Date) {
    myRecordedReceipts(date: $date) {
      date
      count
      voidCount
      totalAmount
      items {
        ...ReceiptFields
      }
    }
  }
  ${RECEIPT_FIELDS}
`;

/** Issuer (same day) or staff: send the receipt SMS again (max 3). */
export const RESEND_RECEIPT_SMS = gql`
  mutation ResendReceiptSms($receiptNumber: String!) {
    resendReceiptSms(receiptNumber: $receiptNumber) {
      success
      message
      receiptNumber
      resendsRemaining
    }
  }
`;

/** Issuer (same day) or staff: ask a treasurer/admin to void a receipt. */
export const REQUEST_RECEIPT_VOID = gql`
  mutation RequestReceiptVoid($receiptNumber: String!, $reason: String!) {
    requestReceiptVoid(receiptNumber: $receiptNumber, reason: $reason) {
      success
      message
      receiptNumber
      voidRequest {
        id
        status
      }
    }
  }
`;

export interface MyRecordedReceiptsData {
  myRecordedReceipts: {
    /** ISO date (YYYY-MM-DD) */
    date: string;
    count: number;
    voidCount: number;
    /** Total of the issued (non-void) receipts */
    totalAmount: string;
    items: Receipt[];
  };
}

export interface MyRecordedReceiptsVars {
  date?: string | null;
}

export interface ResendReceiptSmsData {
  resendReceiptSms: {
    success: boolean;
    message: string;
    receiptNumber: string | null;
    resendsRemaining: number | null;
  };
}

export interface ResendReceiptSmsVars {
  receiptNumber: string;
}

export interface RequestReceiptVoidData {
  requestReceiptVoid: {
    success: boolean;
    message: string;
    receiptNumber: string | null;
    voidRequest: { id: string; status: string } | null;
  };
}

export interface RequestReceiptVoidVars {
  receiptNumber: string;
  reason: string;
}
