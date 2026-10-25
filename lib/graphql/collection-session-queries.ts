/**
 * Collection sessions (T5.1) and statement certification (T5.2).
 * Field names mirror api_schema/treasury_session_schema.py (Strawberry camelCase).
 */

import { gql } from "@apollo/client";

export const COLLECTION_SESSION_FIELDS = gql`
  fragment CollectionSessionFields on CollectionSessionType {
    id
    date
    name
    status
    openedByName
    countedCash
    countedBreakdown {
      denomination
      count
    }
    varianceReason
    recordedTotal
    variance
    receiptCount
    closedByName
    closedAt
    confirmedByName
    confirmedAt
    createdAt
  }
`;

export type CollectionSessionStatus = "open" | "closed" | "confirmed";

export interface CollectionSession {
  id: string;
  /** YYYY-MM-DD (Nairobi) */
  date: string;
  name: string;
  status: CollectionSessionStatus | string;
  openedByName: string | null;
  countedCash: string | null;
  countedBreakdown: { denomination: string; count: number }[];
  varianceReason: string;
  recordedTotal: string;
  /** counted − recorded; null until closed */
  variance: string | null;
  receiptCount: number;
  closedByName: string | null;
  closedAt: string | null;
  confirmedByName: string | null;
  confirmedAt: string | null;
  createdAt: string;
}

export interface CollectionSessionResponse {
  success: boolean;
  message: string;
  session: CollectionSession | null;
}

/** Recording rights: the caller's open session (any date), or null. */
export const GET_MY_OPEN_COLLECTION_SESSION = gql`
  query MyOpenCollectionSession {
    myOpenCollectionSession {
      ...CollectionSessionFields
    }
  }
  ${COLLECTION_SESSION_FIELDS}
`;

export interface MyOpenCollectionSessionData {
  myOpenCollectionSession: CollectionSession | null;
}

/** Staff see every session; a recorder only their own. */
export const GET_COLLECTION_SESSIONS = gql`
  query CollectionSessions($dateFrom: Date, $dateTo: Date, $status: String) {
    collectionSessions(dateFrom: $dateFrom, dateTo: $dateTo, status: $status) {
      ...CollectionSessionFields
    }
  }
  ${COLLECTION_SESSION_FIELDS}
`;

export interface CollectionSessionsData {
  collectionSessions: CollectionSession[];
}

export interface CollectionSessionsVars {
  dateFrom?: string | null;
  dateTo?: string | null;
  status?: string | null;
}

export const OPEN_COLLECTION_SESSION = gql`
  mutation OpenCollectionSession($name: String!) {
    openCollectionSession(name: $name) {
      success
      message
      session {
        ...CollectionSessionFields
      }
    }
  }
  ${COLLECTION_SESSION_FIELDS}
`;

export interface OpenCollectionSessionData {
  openCollectionSession: CollectionSessionResponse;
}

export interface OpenCollectionSessionVars {
  name: string;
}

export const CLOSE_COLLECTION_SESSION = gql`
  mutation CloseCollectionSession(
    $id: ID!
    $countedCash: String!
    $countedBreakdown: [DenominationCountInput!]
    $varianceReason: String
  ) {
    closeCollectionSession(
      id: $id
      countedCash: $countedCash
      countedBreakdown: $countedBreakdown
      varianceReason: $varianceReason
    ) {
      success
      message
      session {
        ...CollectionSessionFields
      }
    }
  }
  ${COLLECTION_SESSION_FIELDS}
`;

export interface CloseCollectionSessionData {
  closeCollectionSession: CollectionSessionResponse;
}

export interface CloseCollectionSessionVars {
  id: string;
  countedCash: string;
  countedBreakdown: { denomination: string; count: number }[] | null;
  varianceReason: string | null;
}

/** Treasurer/admin: confirm receiving a closed session's cash. */
export const CONFIRM_COLLECTION_SESSION = gql`
  mutation ConfirmCollectionSession($id: ID!) {
    confirmCollectionSession(id: $id) {
      success
      message
      session {
        ...CollectionSessionFields
      }
    }
  }
  ${COLLECTION_SESSION_FIELDS}
`;

export interface ConfirmCollectionSessionData {
  confirmCollectionSession: CollectionSessionResponse;
}

// ── Statement certification (T5.2) ─────────────────────────────────────────

export const STATEMENT_CERTIFICATION_FIELDS = gql`
  fragment StatementCertificationFields on StatementCertificationType {
    id
    date
    certifiedByName
    certifiedAt
    isActive
    unlockedAt
    unlockedByName
    unlockReason
  }
`;

export interface StatementCertification {
  id: string;
  date: string;
  certifiedByName: string | null;
  certifiedAt: string;
  /** false once unlocked */
  isActive: boolean;
  unlockedAt: string | null;
  unlockedByName: string | null;
  unlockReason: string;
}

export interface StatementCertificationResponse {
  success: boolean;
  message: string;
  certification: StatementCertification | null;
}

/** Staff: certifications (active and unlocked) dated in [dateFrom, dateTo]. */
export const GET_STATEMENT_CERTIFICATIONS = gql`
  query StatementCertifications($dateFrom: Date!, $dateTo: Date!) {
    statementCertifications(dateFrom: $dateFrom, dateTo: $dateTo) {
      ...StatementCertificationFields
    }
  }
  ${STATEMENT_CERTIFICATION_FIELDS}
`;

export interface StatementCertificationsData {
  statementCertifications: StatementCertification[];
}

export interface StatementCertificationsVars {
  dateFrom: string;
  dateTo: string;
}

/** Treasurer/admin: certify and lock a statement date. */
export const CERTIFY_STATEMENT = gql`
  mutation CertifyStatement($date: Date!) {
    certifyStatement(date: $date) {
      success
      message
      certification {
        ...StatementCertificationFields
      }
    }
  }
  ${STATEMENT_CERTIFICATION_FIELDS}
`;

export interface CertifyStatementData {
  certifyStatement: StatementCertificationResponse;
}

/** Admin only: unlock a certified statement date (reason ≥ 10 characters). */
export const UNLOCK_STATEMENT = gql`
  mutation UnlockStatement($date: Date!, $reason: String!) {
    unlockStatement(date: $date, reason: $reason) {
      success
      message
      certification {
        ...StatementCertificationFields
      }
    }
  }
  ${STATEMENT_CERTIFICATION_FIELDS}
`;

export interface UnlockStatementData {
  unlockStatement: StatementCertificationResponse;
}
