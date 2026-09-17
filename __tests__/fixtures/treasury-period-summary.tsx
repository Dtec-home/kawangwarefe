/**
 * Shared Apollo mocks for the Cash Statement card's period summary (T4.1, T4.2).
 */
import React from 'react'
import { vi } from 'vitest'
import type { MockLink } from '@apollo/client/testing'
import { GET_CURRENT_USER_ROLE } from '@/lib/hooks/use-user-role'
import { GET_PERIOD_SUMMARY } from '@/lib/graphql/treasury-queries'

export type Persona = 'treasurer' | 'admin' | 'pastor'

export function roleMock(persona: Persona): MockLink.MockedResponse {
  return {
    request: { query: GET_CURRENT_USER_ROLE },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: {
      data: {
        currentUserRole: {
          __typename: 'UserRoleInfo',
          isAuthenticated: true,
          isStaff: true,
          isCategoryAdmin: false,
          isGroupAdmin: false,
          isContentAdmin: false,
          canSendBulkMessage: true,
          isRecorder: false,
          canVoidReceipts: persona !== 'pastor',
          isAdmin: persona === 'admin',
          isTreasurer: persona === 'treasurer',
          adminCategoryIds: [],
          adminGroupNames: [],
          adminCategories: [],
        },
      },
    },
  }
}

export function opening(overrides: Record<string, unknown> = {}) {
  return {
    __typename: 'LocalFundOpeningBalanceType',
    id: '1',
    amount: '12500.00',
    asOfDate: '2026-01-01',
    note: '',
    setByName: 'Jane Treasurer',
    createdAt: '2026-01-02T08:00:00+00:00',
    ...overrides,
  }
}

export function remittance(overrides: Record<string, unknown> = {}) {
  return {
    __typename: 'RemittanceType',
    id: '7',
    periodFrom: '2026-09-01',
    periodTo: '2026-09-30',
    method: 'bank_slip',
    methodLabel: 'Bank slip',
    amount: '45000.00',
    reference: 'SLIP-001',
    remittedOn: '2026-09-14',
    note: '',
    recordedByName: 'Jane Treasurer',
    createdAt: '2026-09-14T08:00:00+00:00',
    updatedAt: '2026-09-14T08:00:00+00:00',
    ...overrides,
  }
}

export interface SummaryOptions {
  opening?: ReturnType<typeof opening> | null
  remittances?: ReturnType<typeof remittance>[]
  balanceBroughtForward?: string | null
  received?: string
  total?: string
  lessPayment?: string
  balanceEnd?: string
  note?: string | null
  summary?: Partial<Record<'cash' | 'bankSlip' | 'cheque' | 'moneyOrder' | 'total', string>> & { count?: number }
}

export function summaryData(dateFrom: string, dateTo: string, o: SummaryOptions = {}) {
  const remittances = o.remittances ?? []
  return {
    localFundOpeningBalance: o.opening === undefined ? opening() : o.opening,
    localFundStatement: {
      __typename: 'LocalFundStatementType',
      dateFrom,
      dateTo,
      received: o.received ?? '8000.00',
      balanceBroughtForward: o.balanceBroughtForward === undefined ? '15000.00' : o.balanceBroughtForward,
      total: o.total ?? '23000.00',
      lessPayment: o.lessPayment ?? '3000.00',
      balanceEnd: o.balanceEnd ?? '20000.00',
      note: o.note ?? null,
    },
    remittances,
    remittanceSummary: {
      __typename: 'RemittanceSummaryType',
      dateFrom,
      dateTo,
      cash: '0.00',
      bankSlip: '0.00',
      cheque: '0.00',
      moneyOrder: '0.00',
      total: '0.00',
      count: remittances.length,
      ...o.summary,
    },
  }
}

/** A GET_PERIOD_SUMMARY mock that counts how often each range was requested. */
export function summaryMock(
  dateFrom: string,
  dateTo: string,
  options: SummaryOptions | (() => SummaryOptions) = {},
  calls?: { count: number },
): MockLink.MockedResponse {
  return {
    request: { query: GET_PERIOD_SUMMARY, variables: { dateFrom, dateTo } },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: () => {
      if (calls) calls.count += 1
      const o = typeof options === 'function' ? options() : options
      return { data: summaryData(dateFrom, dateTo, o) }
    },
  }
}

/** A mutation mock that records its variables and answers with `data`. */
export function mutationMock(
  query: MockLink.MockedRequest['query'],
  record: (variables: Record<string, unknown>) => void,
  data: Record<string, unknown>,
): MockLink.MockedResponse {
  return {
    request: { query, variables: () => true },
    result: (variables: Record<string, unknown>) => {
      record(variables)
      return { data }
    },
  }
}

/** Native <select> stand-in for the Radix Select (jsdom has no popovers). */
export const selectMock = () => ({
  Select: ({ name, value, onValueChange, children }: { name?: string; value?: string; onValueChange?: (v: string) => void; children: React.ReactNode }) => (
    <select aria-label={name} value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      <option value="">—</option>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
})

export const toastMock = () => ({ toast: { success: vi.fn(), error: vi.fn() } })
