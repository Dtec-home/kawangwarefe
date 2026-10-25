/**
 * Treasury Digital Books — queries.
 * Field names mirror api_schema/treasury_queries.py (Strawberry camelCase).
 */

import { gql } from "@apollo/client";

export const ENTRY_DATE_UNLOCK_FIELDS = gql`
  fragment EntryDateUnlockFields on EntryDateUnlockType {
    id
    unlockDate
    reason
    openedByName
    expiresAt
    closedAt
    createdAt
    isActive
  }
`;

/** Open, unexpired catch-up windows (staff or recorder). */
export const GET_ACTIVE_ENTRY_DATE_UNLOCKS = gql`
  query GetActiveEntryDateUnlocks {
    activeEntryDateUnlocks {
      ...EntryDateUnlockFields
    }
  }
  ${ENTRY_DATE_UNLOCK_FIELDS}
`;

export interface EntryDateUnlock {
  id: string;
  /** ISO date (YYYY-MM-DD) the window allows recording for */
  unlockDate: string;
  reason: string;
  openedByName: string | null;
  expiresAt: string;
  closedAt: string | null;
  createdAt: string;
  isActive: boolean;
}

export interface ActiveEntryDateUnlocksData {
  activeEntryDateUnlocks: EntryDateUnlock[];
}

/** Staff only: the Cash Statement's fund columns for a range, in print order (T3.1). */
export const GET_STATEMENT_COLUMNS = gql`
  query GetStatementColumns($dateFrom: Date!, $dateTo: Date!) {
    statementColumns(dateFrom: $dateFrom, dateTo: $dateTo) {
      key
      label
      isTrust
    }
  }
`;

export interface StatementColumn {
  /** "category:<id>" or "purpose:<id>" */
  key: string;
  label: string;
  isTrust: boolean;
}

export interface StatementColumnsData {
  statementColumns: StatementColumn[];
}

export const LOCAL_FUND_OPENING_BALANCE_FIELDS = gql`
  fragment LocalFundOpeningBalanceFields on LocalFundOpeningBalanceType {
    id
    amount
    asOfDate
    note
    setByName
    createdAt
  }
`;

export const REMITTANCE_FIELDS = gql`
  fragment RemittanceFields on RemittanceType {
    id
    periodFrom
    periodTo
    method
    methodLabel
    amount
    reference
    remittedOn
    note
    recordedByName
    createdAt
    updatedAt
  }
`;

/**
 * Staff only: the Cash Statement card's period summary (T4.1, T4.2) — the local
 * fund opening balance and statement, and the remittances for the range.
 */
export const GET_PERIOD_SUMMARY = gql`
  query GetPeriodSummary($dateFrom: Date!, $dateTo: Date!) {
    localFundOpeningBalance {
      ...LocalFundOpeningBalanceFields
    }
    localFundStatement(dateFrom: $dateFrom, dateTo: $dateTo) {
      dateFrom
      dateTo
      received
      balanceBroughtForward
      total
      lessPayment
      balanceEnd
      note
    }
    remittances(dateFrom: $dateFrom, dateTo: $dateTo) {
      ...RemittanceFields
    }
    remittanceSummary(dateFrom: $dateFrom, dateTo: $dateTo) {
      dateFrom
      dateTo
      cash
      bankSlip
      cheque
      moneyOrder
      total
      count
    }
  }
  ${LOCAL_FUND_OPENING_BALANCE_FIELDS}
  ${REMITTANCE_FIELDS}
`;

export interface LocalFundOpeningBalance {
  id: string;
  /** Decimal string; may be negative */
  amount: string;
  asOfDate: string;
  note: string;
  setByName: string | null;
  createdAt: string;
}

export interface LocalFundStatement {
  dateFrom: string;
  dateTo: string;
  received: string;
  /** Null when no opening balance applies (a blank b/f counts as 0). */
  balanceBroughtForward: string | null;
  total: string;
  lessPayment: string;
  balanceEnd: string;
  note: string | null;
}

export type RemittanceMethod = "cash" | "bank_slip" | "cheque" | "money_order";

export interface Remittance {
  id: string;
  periodFrom: string;
  periodTo: string;
  method: RemittanceMethod | string;
  methodLabel: string;
  amount: string;
  reference: string;
  remittedOn: string;
  note: string;
  recordedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RemittanceSummary {
  dateFrom: string;
  dateTo: string;
  cash: string;
  bankSlip: string;
  cheque: string;
  moneyOrder: string;
  total: string;
  count: number;
}

export interface PeriodSummaryData {
  localFundOpeningBalance: LocalFundOpeningBalance | null;
  localFundStatement: LocalFundStatement;
  remittances: Remittance[];
  remittanceSummary: RemittanceSummary;
}
