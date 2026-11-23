/**
 * Fund transfers (FT-2) and moving a gift (RA-2) — client types.
 *
 * Mirrors the live GraphQL schema (DEPARTMENT_REPORTS/04_CONTRACTS_ADDITIONS.md
 * sections A and B). Money travels as strings ("1500.00").
 */

export type FundTransferStatus = "requested" | "approved" | "rejected" | "cancelled";

export interface FundRef {
  __typename?: "ContributionCategoryType";
  id: string;
  name: string;
  code: string;
}

export interface PurposeRef {
  __typename?: "DepartmentPurposeType";
  id: string;
  name: string;
  code: string;
}

export interface FundTransfer {
  __typename: "FundTransfer";
  id: string;
  fromDepartment: FundRef;
  fromPurpose: PurposeRef | null;
  toDepartment: FundRef;
  toPurpose: PurposeRef | null;
  amount: string;
  transferDate: string;
  reason: string;
  status: FundTransferStatus | string;
  requestedBy: string;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionNote: string;
  canApprove: boolean;
  canCancel: boolean;
}

export interface FundTransferError {
  __typename: "FundTransferError";
  code: string;
  message: string;
}

export type FundTransferResult = FundTransfer | FundTransferError;

export interface FundTransferInput {
  fromDepartmentId: string;
  fromPurposeId: string | null;
  toDepartmentId: string;
  toPurposeId: string | null;
  amount: string;
  transferDate: string;
  reason: string;
}

export interface ReallocationTargetInput {
  departmentId: string;
  purposeId: string | null;
  amount: string;
}

export interface ReallocationLine {
  __typename?: "ReallocationLine";
  department: string;
  purpose: string | null;
  amount: string;
}

export interface ReallocationPreview {
  __typename?: "ReallocationPreview";
  ok: boolean;
  code: string | null;
  message: string;
  total: string;
  before: ReallocationLine[];
  after: ReallocationLine[];
}

/** A line of the payment being moved, as the contributions list knows it. */
export interface PaymentLine {
  departmentId: string;
  departmentName: string;
  purposeName: string | null;
  amount: string;
}
