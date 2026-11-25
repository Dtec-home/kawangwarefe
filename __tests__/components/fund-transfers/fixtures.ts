/**
 * Object mothers + MockedProvider responses for the fund transfer screens
 * (FT-2) and the move-gift dialog (RA-2). GraphQL-shaped (with __typename)
 * so the cache writes them without missing-field warnings.
 */

import type { MockedResponse } from "@apollo/client/testing/react";

import {
  GET_FUND_AVAILABLE_BALANCE,
  GET_FUND_TRANSFERS,
  PREVIEW_PAYMENT_REALLOCATION,
  REALLOCATE_PAYMENT,
} from "@/lib/graphql/fund-transfers";
import { GET_CONTRIBUTION_CATEGORIES, GET_DEPARTMENT_PURPOSES, GET_GIVING_CATEGORIES } from "@/lib/graphql/queries";
import type { FundTransfer, ReallocationPreview, ReallocationTargetInput } from "@/lib/fund-transfers/types";

const MANY = Number.POSITIVE_INFINITY;

export const category = (id: string, name: string) => ({
  __typename: "ContributionCategoryType" as const,
  id,
  name,
  code: name.slice(0, 4).toUpperCase(),
  description: "",
  isActive: true,
  routingMode: "none",
  fallbackIfNoGroup: "top_level",
  audience: "both",
  hasAutoSplit: false,
  tracksMemberIdentifier: false,
  identifierLabel: "",
  identifierFormat: "",
  allowedGroups: [],
});

export const DEPARTMENTS = [category("1", "Youth"), category("2", "Building Fund"), category("3", "Tithe")];

export const purpose = (id: string, name: string) => ({
  __typename: "DepartmentPurposeType" as const,
  id,
  name,
  code: name.slice(0, 4).toUpperCase(),
  description: "",
  isActive: true,
});

const ref = (d: { id: string; name: string; code: string }) => ({
  __typename: "ContributionCategoryType" as const,
  id: d.id,
  name: d.name,
  code: d.code,
});

export function makeTransfer(overrides: Partial<FundTransfer> = {}): FundTransfer {
  return {
    __typename: "FundTransfer",
    id: "10",
    fromDepartment: ref(DEPARTMENTS[0]),
    fromPurpose: null,
    toDepartment: ref(DEPARTMENTS[1]),
    toPurpose: null,
    amount: "5000.00",
    transferDate: "2026-11-20",
    reason: "Youth surplus to the roof",
    status: "requested",
    requestedBy: "Grace Treasurer",
    decidedBy: null,
    decidedAt: null,
    decisionNote: "",
    canApprove: false,
    canCancel: false,
    ...overrides,
  };
}

export const categoriesMock = (): MockedResponse => ({
  request: { query: GET_CONTRIBUTION_CATEGORIES },
  result: { data: { contributionCategories: DEPARTMENTS } },
  maxUsageCount: MANY,
});

/** Move gift picks a target from the departments that accept giving (R2). */
export const givingCategoriesMock = (): MockedResponse => ({
  request: { query: GET_GIVING_CATEGORIES },
  result: { data: { contributionCategories: DEPARTMENTS } },
  maxUsageCount: MANY,
});

export const purposesMock = (categoryId: string, purposes: ReturnType<typeof purpose>[]): MockedResponse => ({
  request: { query: GET_DEPARTMENT_PURPOSES, variables: { categoryId, isActive: true } },
  result: { data: { departmentPurposes: purposes } },
  maxUsageCount: MANY,
});

export const balanceMock = (
  departmentId: string,
  purposeId: string | null,
  onDate: string,
  value: string,
): MockedResponse => ({
  request: { query: GET_FUND_AVAILABLE_BALANCE, variables: { departmentId, purposeId, onDate } },
  result: { data: { fundAvailableBalance: value } },
  maxUsageCount: MANY,
});

export const transfersMock = (
  list: () => FundTransfer[],
  variables: { status: string | null; departmentId: string | null } = { status: null, departmentId: null },
): MockedResponse => ({
  request: { query: GET_FUND_TRANSFERS, variables },
  result: () => ({ data: { fundTransfers: list() } }),
  maxUsageCount: MANY,
});

export const previewOk = (overrides: Partial<ReallocationPreview> = {}): ReallocationPreview => ({
  __typename: "ReallocationPreview",
  ok: true,
  code: null,
  message: "Preview only. Nothing changed.",
  total: "1000.00",
  before: [{ __typename: "ReallocationLine", department: "Tithe", purpose: null, amount: "1000.00" }],
  after: [
    { __typename: "ReallocationLine", department: "Building Fund", purpose: "Roof", amount: "600.00" },
    { __typename: "ReallocationLine", department: "Youth", purpose: null, amount: "400.00" },
  ],
  ...overrides,
});

export const previewRefused = (code: string, message: string): ReallocationPreview => ({
  __typename: "ReallocationPreview",
  ok: false,
  code,
  message,
  total: "0.00",
  before: [],
  after: [],
});

export const previewMock = (
  contributionGroupId: string,
  targets: ReallocationTargetInput[],
  result: ReallocationPreview,
): MockedResponse => ({
  request: { query: PREVIEW_PAYMENT_REALLOCATION, variables: { contributionGroupId, targets } },
  result: { data: { previewPaymentReallocation: result } },
  maxUsageCount: MANY,
});

export const reallocateMock = (
  contributionGroupId: string,
  targets: ReallocationTargetInput[],
  reason: string,
  result: ReallocationPreview,
  onCall?: () => void,
): MockedResponse => ({
  request: { query: REALLOCATE_PAYMENT, variables: { contributionGroupId, targets, reason } },
  result: () => {
    onCall?.();
    return { data: { reallocatePayment: result } };
  },
});
