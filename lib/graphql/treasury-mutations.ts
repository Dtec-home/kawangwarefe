/**
 * Treasury Digital Books — mutations.
 * Field names mirror api_schema/treasury_mutations.py (Strawberry camelCase).
 */

import { gql } from "@apollo/client";
import {
  ENTRY_DATE_UNLOCK_FIELDS,
  LOCAL_FUND_OPENING_BALANCE_FIELDS,
  REMITTANCE_FIELDS,
  type EntryDateUnlock,
  type LocalFundOpeningBalance,
  type Remittance,
} from "./treasury-queries";

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

/** Treasurer/admin: set the local fund opening balance (T4.1). Amount may be negative. */
export const SET_LOCAL_FUND_OPENING_BALANCE = gql`
  mutation SetLocalFundOpeningBalance($amount: String!, $asOfDate: Date!, $note: String) {
    setLocalFundOpeningBalance(amount: $amount, asOfDate: $asOfDate, note: $note) {
      success
      message
      openingBalance {
        ...LocalFundOpeningBalanceFields
      }
    }
  }
  ${LOCAL_FUND_OPENING_BALANCE_FIELDS}
`;

export interface SetLocalFundOpeningBalanceData {
  setLocalFundOpeningBalance: {
    success: boolean;
    message: string;
    openingBalance: LocalFundOpeningBalance | null;
  };
}

export interface SetLocalFundOpeningBalanceVars {
  amount: string;
  asOfDate: string;
  note: string;
}

/** Treasurer/admin: record a remittance to the conference (T4.2). */
export const CREATE_REMITTANCE = gql`
  mutation CreateRemittance(
    $periodFrom: Date!
    $periodTo: Date!
    $method: String!
    $amount: String!
    $remittedOn: Date!
    $reference: String
    $note: String
  ) {
    createRemittance(
      periodFrom: $periodFrom
      periodTo: $periodTo
      method: $method
      amount: $amount
      remittedOn: $remittedOn
      reference: $reference
      note: $note
    ) {
      success
      message
      remittance {
        ...RemittanceFields
      }
    }
  }
  ${REMITTANCE_FIELDS}
`;

/** Treasurer/admin: change a remittance; omitted fields stay as they are. */
export const UPDATE_REMITTANCE = gql`
  mutation UpdateRemittance(
    $id: ID!
    $periodFrom: Date
    $periodTo: Date
    $method: String
    $amount: String
    $remittedOn: Date
    $reference: String
    $note: String
  ) {
    updateRemittance(
      id: $id
      periodFrom: $periodFrom
      periodTo: $periodTo
      method: $method
      amount: $amount
      remittedOn: $remittedOn
      reference: $reference
      note: $note
    ) {
      success
      message
      remittance {
        ...RemittanceFields
      }
    }
  }
  ${REMITTANCE_FIELDS}
`;

/** Treasurer/admin: delete a remittance (hard delete, audit-logged). */
export const DELETE_REMITTANCE = gql`
  mutation DeleteRemittance($id: ID!) {
    deleteRemittance(id: $id) {
      success
      message
    }
  }
`;

export interface RemittanceResponse {
  success: boolean;
  message: string;
  remittance?: Remittance | null;
}

export interface RemittanceInputVars {
  periodFrom: string;
  periodTo: string;
  method: string;
  amount: string;
  remittedOn: string;
  reference: string;
  note: string;
}

export interface CreateRemittanceData {
  createRemittance: RemittanceResponse;
}

export interface UpdateRemittanceData {
  updateRemittance: RemittanceResponse;
}

export type UpdateRemittanceVars = { id: string } & Partial<RemittanceInputVars>;

export interface DeleteRemittanceData {
  deleteRemittance: RemittanceResponse;
}
