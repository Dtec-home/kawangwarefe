/**
 * Binding for `recorder/recorder_workspace.feature` (T2.5).
 *
 * Drives the real `RecorderWorkspace` through Apollo's MockedProvider with the
 * app's real GraphQL documents (lookup, create, today's receipts, void request).
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, screen, waitFor, fireEvent, cleanup, within } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import React from 'react'
import { vi } from 'vitest'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@/lib/hooks/use-user-role', () => ({
  useUserRole: () => ({ isPureRecorder: true, isRecorder: true, isStaff: false, loading: false }),
}))
vi.mock('@/lib/hooks/use-active-entry-unlocks', () => ({
  useActiveEntryUnlocks: () => ({ unlocks: [], unlockDates: [], hasActiveUnlocks: false, loading: false, refetch: vi.fn() }),
}))
vi.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: { value?: string; onValueChange?: (v: string) => void; children: React.ReactNode }) => (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      <option value="" />
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => <option value={value}>{children}</option>,
}))

import {
  CREATE_MANUAL_MULTI_CONTRIBUTION,
  LOOKUP_MEMBER_BY_PHONE,
} from '@/lib/graphql/manual-contribution-mutations'
import { GET_CONTRIBUTION_CATEGORIES, GET_PAYBILL_INSTRUCTION_MESSAGE } from '@/lib/graphql/queries'
import { GET_MY_RECORDED_RECEIPTS, REQUEST_RECEIPT_VOID } from '@/lib/graphql/recorder-queries'
import { GET_MY_OPEN_COLLECTION_SESSION } from '@/lib/graphql/collection-session-queries'
import { equal } from '@wry/equality'
import { RecorderWorkspace } from '@/components/recorder/recorder-workspace'

const feature = loadFeature('./recorder_workspace.feature', { loadRelativePath: true })

const CATEGORIES = [
  { id: '1', name: 'Tithe', code: 'TITHE' },
  { id: '2', name: 'Combined Offering', code: 'OFFERING' },
].map((c) => ({
  __typename: 'ContributionCategoryType',
  ...c,
  description: '',
  isActive: true,
  routingMode: 'TOP_LEVEL',
  fallbackIfNoGroup: null,
  audience: 'all',
  hasAutoSplit: false,
  tracksMemberIdentifier: false,
  identifierLabel: '',
  identifierFormat: '',
  allowedGroups: [],
}))

function receipt(overrides: Record<string, unknown>) {
  return {
    __typename: 'ReceiptType',
    id: '11',
    number: '20260917-0012',
    receiptDate: '2026-09-17',
    channel: 'cash',
    status: 'issued',
    totalAmount: '1500.00',
    giverName: null,
    memberName: 'Mary Wanjiru',
    issuedByName: 'Rita Recorder',
    legacyBookNumber: null,
    mpesaCode: null,
    voidedAt: null,
    voidReason: '',
    createdAt: '2026-09-17T07:05:00Z',
    lines: [],
    ...overrides,
  }
}

interface World {
  receipts: Record<string, unknown>[]
  mocks: MockedResponse[]
  voidRequests: Record<string, unknown>[]
}

function baseMocks(world: World): MockedResponse[] {
  return [
    {
      request: { query: GET_CONTRIBUTION_CATEGORIES, variables: () => true },
      result: { data: { contributionCategories: CATEGORIES } },
      maxUsageCount: 20,
    },
    {
      request: { query: GET_PAYBILL_INSTRUCTION_MESSAGE, variables: () => true },
      result: { data: { paybillInstructionMessage: null } },
      maxUsageCount: 50,
    },
    {
      request: { query: GET_MY_OPEN_COLLECTION_SESSION, variables: () => true },
      result: { data: { myOpenCollectionSession: null } },
      maxUsageCount: 50,
    },
    {
      request: { query: GET_MY_RECORDED_RECEIPTS, variables: () => true },
      result: () => ({
        data: {
          myRecordedReceipts: {
            __typename: 'MyRecordedReceipts',
            date: '2026-09-17',
            count: world.receipts.length,
            voidCount: 0,
            totalAmount: '1500.00',
            items: world.receipts,
          },
        },
      }),
      maxUsageCount: 50,
    },
  ]
}

function createMock(variables: Record<string, unknown>, receiptNumber: string, smsSent: boolean): MockedResponse {
  return {
    request: {
      query: CREATE_MANUAL_MULTI_CONTRIBUTION,
      // Every submission carries a client idempotency key (T5.3)
      variables: (actual: Record<string, unknown>) => {
        const { idempotencyKey, ...rest } = actual
        return typeof idempotencyKey === 'string' && idempotencyKey.length > 0 && equal(rest, variables)
      },
    },
    result: {
      data: {
        createManualMultiContribution: {
          __typename: 'ManualMultiContributionResponse',
          success: true,
          message: 'Recorded',
          contributionGroupId: 'g1',
          totalAmount: '0',
          receiptNumber,
          isGuest: false,
          smsSent,
          idempotentReplay: false,
        },
      },
    },
  }
}

function openWorkspace(world: World) {
  render(
    <MockedProvider mocks={[...baseMocks(world), ...world.mocks]}>
      <RecorderWorkspace />
    </MockedProvider>
  )
}

async function selectDepartment(index: number, name: string) {
  await waitFor(() => {
    const selects = screen.getAllByRole('combobox').filter((el) => el.querySelector('option[value="1"]'))
    expect(selects.length).toBeGreaterThan(index)
  })
  const select = screen
    .getAllByRole('combobox')
    .filter((el) => el.querySelector('option[value="1"]'))[index] as HTMLSelectElement
  const option = Array.from(select.options).find((o) => o.textContent?.includes(name))!
  fireEvent.change(select, { target: { value: option.value } })
}

function setAmount(index: number, amount: string) {
  fireEvent.change(document.getElementById(`amount-${index}`) as HTMLInputElement, { target: { value: amount } })
}

async function reviewAndConfirm() {
  fireEvent.click(screen.getByRole('button', { name: /Review & save/ }))
  const dialog = await screen.findByRole('dialog')
  fireEvent.click(within(dialog).getByRole('button', { name: /Confirm & issue receipt/ }))
}

defineFeature(feature, (test) => {
  let world: World

  beforeEach(() => {
    cleanup()
    world = { receipts: [], mocks: [], voidRequests: [] }
  })

  const givenRecorder = (given: (m: string | RegExp, fn: () => void) => void) =>
    given('a signed-in recorder', () => {
      /* role is mocked as a pure recorder */
    })

  const thenReceiptShown = (then: (m: string | RegExp, fn: (...a: string[]) => Promise<void>) => void) =>
    then(/^receipt "(.*)" is shown$/, async (number: string) => {
      expect(await screen.findByTestId('issued-receipt-number')).toHaveTextContent(number)
    })

  const andSmsStatus = (and: (m: string | RegExp, fn: (...a: string[]) => void) => void) =>
    and(/^the SMS status says "(.*)"$/, (text: string) => {
      expect(screen.getByTestId('sms-status')).toHaveTextContent(text)
    })

  test("A recorder records a member's multi-line cash gift", ({ given, and, when, then }) => {
    givenRecorder(given)
    and(/^the phone "(.*)" belongs to "(.*)"$/, (phone: string, name: string) => {
      world.mocks.push({
        request: { query: LOOKUP_MEMBER_BY_PHONE, variables: { phoneNumber: phone } },
        result: {
          data: {
            lookupMemberByPhone: {
              __typename: 'MemberLookupResponse',
              success: true,
              found: true,
              message: `Member found: ${name}`,
              isGuest: false,
              phoneNumber: null,
              member: null,
              giver: { __typename: 'MemberLookupGiverType', id: '7', displayName: name },
            },
          },
        },
        maxUsageCount: 3,
      })
      world.mocks.push(
        createMock(
          {
            contributions: [
              { categoryId: '1', amount: '1000', purposeId: null, memberIdentifier: null },
              { categoryId: '2', amount: '500', purposeId: null, memberIdentifier: null },
            ],
            phoneNumber: phone,
            giverName: null,
            entryType: 'cash',
          },
          '20260917-0012',
          true
        )
      )
    })
    when(/^they look up the phone "(.*)"$/, (phone: string) => {
      openWorkspace(world)
      fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: phone } })
      fireEvent.click(screen.getByRole('button', { name: /Search/ }))
    })
    then(/^they are asked to confirm the name "(.*)"$/, async (name: string) => {
      expect(await screen.findByTestId('giver-found')).toHaveTextContent(name)
    })
    when(/^they add "(.*)" to "(.*)" and "(.*)" to "(.*)"$/, async (a1: string, d1: string, a2: string, d2: string) => {
      await selectDepartment(0, d1)
      setAmount(0, a1)
      fireEvent.click(screen.getByRole('button', { name: /Add another fund/ }))
      await selectDepartment(1, d2)
      setAmount(1, a2)
      expect(screen.getByTestId('lines-total')).toHaveTextContent('KES 1,500.00')
    })
    and('they review and confirm the gift', reviewAndConfirm)
    thenReceiptShown(then)
    andSmsStatus(and)
  })

  test('A walk-in giver gets a receipt but no SMS', ({ given, when, then, and }) => {
    givenRecorder(given)
    when(/^they record a walk-in gift of "(.*)" to "(.*)" from "(.*)"$/, async (amount: string, dept: string, name: string) => {
      world.mocks.push(
        createMock(
          {
            contributions: [{ categoryId: '1', amount, purposeId: null, memberIdentifier: null }],
            phoneNumber: null,
            giverName: name,
            entryType: 'cash',
          },
          '20260917-0013',
          false
        )
      )
      openWorkspace(world)
      fireEvent.click(screen.getByLabelText('Walk-in / no phone'))
      fireEvent.change(screen.getByLabelText('Giver Name *'), { target: { value: name } })
      await selectDepartment(0, dept)
      setAmount(0, amount)
      await reviewAndConfirm()
    })
    thenReceiptShown(then)
    andSmsStatus(and)
  })

  test("A recorder asks for a void from today's entries", ({ given, and, when, then }) => {
    givenRecorder(given)
    and(/^they issued receipt "(.*)" for "(.*)" of "(.*)" today$/, (number: string, name: string, amount: string) => {
      world.receipts.push(receipt({ number, memberName: name, totalAmount: amount }))
      world.mocks.push({
        request: { query: REQUEST_RECEIPT_VOID, variables: () => true },
        result: (variables) => {
          world.voidRequests.push(variables as Record<string, unknown>)
          return {
            data: {
              requestReceiptVoid: {
                __typename: 'RequestReceiptVoidResponse',
                success: true,
                message: `Void requested for receipt ${number}`,
                receiptNumber: number,
                voidRequest: { __typename: 'ReceiptVoidRequestType', id: '9', status: 'pending' },
              },
            },
          }
        },
      })
    })
    when("they open today's entries", async () => {
      openWorkspace(world)
      fireEvent.mouseDown(await screen.findByRole('tab', { name: "Today's entries (1)" }))
    })
    then(/^today's entries list receipt "(.*)" for "(.*)"$/, async (number: string, name: string) => {
      expect(await screen.findByTestId(`entry-${number}`)).toHaveTextContent(name)
    })
    when(/^they request a void of "(.*)" because "(.*)"$/, async (number: string, reason: string) => {
      const entry = screen.getByTestId(`entry-${number}`)
      fireEvent.click(within(entry).getByRole('button', { name: /Request void/ }))
      const dialog = await screen.findByRole('dialog')
      fireEvent.change(within(dialog).getByLabelText('Reason'), { target: { value: reason } })
      fireEvent.click(within(dialog).getByRole('button', { name: 'Send request' }))
      await waitFor(() => expect(world.voidRequests).toContainEqual({ receiptNumber: number, reason }))
    })
    then(/^receipt "(.*)" shows the void was requested$/, async (number: string) => {
      const entry = await screen.findByTestId(`entry-${number}`)
      expect(await within(entry).findByText('Void requested')).toBeInTheDocument()
    })
  })
})
