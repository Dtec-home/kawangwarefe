/**
 * Treasury Digital Books — mutations.
 * Field names mirror api_schema/treasury_mutations.py (Strawberry camelCase).
 */

import { gql } from "@apollo/client";
import { ENTRY_DATE_UNLOCK_FIELDS, type EntryDateUnlock } from "./treasury-queries";

/** Admin only: open a catch-up window for a past date (hours 1–72). */
export const OPEN_ENTRY_DATE_UNLOCK = gql`
  mutation OpenEntryDateUnlock($date: Date!, $reason: String!, $hours: Int!) {
    openEntryDateUnlock(date: $date, reason: $reason, hours: $hours) {
      success
      message
      unlock {
        ...EntryDateUnlockFields
      }
    }
  }
  ${ENTRY_DATE_UNLOCK_FIELDS}
`;

/** Admin only: close a catch-up window early. */
export const CLOSE_ENTRY_DATE_UNLOCK = gql`
  mutation CloseEntryDateUnlock($id: ID!) {
    closeEntryDateUnlock(id: $id) {
      success
      message
      unlock {
        ...EntryDateUnlockFields
      }
    }
  }
  ${ENTRY_DATE_UNLOCK_FIELDS}
`;

export interface EntryDateUnlockResponse {
  success: boolean;
  message: string;
  unlock: EntryDateUnlock | null;
}

export interface OpenEntryDateUnlockData {
  openEntryDateUnlock: EntryDateUnlockResponse;
}

export interface OpenEntryDateUnlockVars {
  date: string;
  reason: string;
  hours: number;
}

export interface CloseEntryDateUnlockData {
  closeEntryDateUnlock: EntryDateUnlockResponse;
}

export interface CloseEntryDateUnlockVars {
  id: string;
}

/**
 * Staff only: the Treasurer's Cash Statement for [dateFrom, dateTo] (max 366
 * days) as base64 — format "pdf" | "excel", paper "letter" | "a4" (T3.4).
 */
export const GENERATE_CASH_STATEMENT = gql`
  mutation GenerateCashStatement($dateFrom: Date!, $dateTo: Date!, $format: String!, $paper: String) {
    generateCashStatement(dateFrom: $dateFrom, dateTo: $dateTo, format: $format, paper: $paper) {
      success
      message
      fileData
      filename
      contentType
    }
  }
`;

export interface GenerateCashStatementData {
  generateCashStatement: {
    success: boolean;
    message: string;
    fileData: string | null;
    filename: string | null;
    contentType: string | null;
  };
}
