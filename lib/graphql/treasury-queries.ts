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
