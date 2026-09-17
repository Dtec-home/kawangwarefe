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
