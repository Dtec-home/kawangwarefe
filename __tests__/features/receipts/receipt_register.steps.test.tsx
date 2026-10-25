/**
 * Binding for `receipts/receipt_register.feature` (T1.8).
 *
 * Drives the real `ReceiptRegister`, `VoidReceiptDialog` and `useUserRole()`
 * through Apollo's MockedProvider with the app's real GraphQL documents.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { render, screen, waitFor, fireEvent, cleanup, within } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import React from 'react'
import { vi } from 'vitest'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/admin/receipts',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import { GET_CURRENT_USER_ROLE } from '@/lib/hooks/use-user-role'
import { GET_RECEIPTS, VOID_RECEIPT } from '@/lib/graphql/receipt-queries'
import { ReceiptRegister } from '@/components/receipts/receipt-register'

const feature = loadFeature('./receipt_register.feature', { loadRelativePath: true })

const TODAY = '2026-09-17'

function role(canVoidReceipts: boolean) {
  return {
    __typename: 'UserRoleInfo',
    isAuthenticated: true,
    isStaff: true,
    isCategoryAdmin: false,
    isGroupAdmin: false,
    isContentAdmin: false,
    canSendBulkMessage: true,
    isRecorder: false,
    canVoidReceipts,
    isAdmin: false,
    isTreasurer: canVoidReceipts,
    adminCategoryIds: [],
    adminGroupNames: [],
    adminCategories: [],
  }
}

function receipt(overrides: Record<string, unknown>) {
  return {
    __typename: 'ReceiptType',
    id: '11',
    number: '20260917-0003',
    receiptDate: TODAY,
    channel: 'envelope',
    status: 'issued',
    totalAmount: '1500.00',
    giverName: null,
    memberName: 'Mary Wanjiru',
    issuedByName: 'Tom Recorder',
    legacyBookNumber: null,
    mpesaCode: null,
    voidedAt: null,
    voidReason: '',
    createdAt: '2026-09-17T07:00:00Z',
    lines: [],
    ...overrides,
  }
}

function receiptsMock(search: string | null, items: unknown[]): MockedResponse {
  return {
    request: {
      query: GET_RECEIPTS,
      variables: {
        filter: { dateFrom: TODAY, dateTo: TODAY, channel: null, status: null, search },
        limit: 50,
        offset: 0,
      },
    },
    result: { data: { receipts: { __typename: 'ReceiptPage', totalCount: items.length, items } } },
  }
}

interface World {
  canVoid: boolean
  receipts: Record<string, unknown>[]
  extraMocks: MockedResponse[]
}

function openRegister(world: World) {
  const mocks: MockedResponse[] = [
    { request: { query: GET_CURRENT_USER_ROLE }, result: { data: { currentUserRole: role(world.canVoid) } }, maxUsageCount: 10 },
    receiptsMock(null, world.receipts),
    ...world.extraMocks,
  ]
  render(
    <MockedProvider mocks={mocks}>
      <ReceiptRegister />
    </MockedProvider>
  )
}

async function rowFor(number: string) {
  const table = await screen.findByRole('table')
  const cell = await within(table).findByText(number)
  return cell.closest('tr') as HTMLElement
}

defineFeature(feature, (test) => {
  let world: World

  beforeEach(() => {
    cleanup()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-17T09:00:00Z'))
    world = { canVoid: false, receipts: [], extraMocks: [] }
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  const givenStaff = (given: (m: string | RegExp, fn: () => void) => void) =>
    given('a signed-in staff member who cannot void receipts', () => {
      world.canVoid = false
    })

  const givenIssuedToday = (and: (m: string | RegExp, fn: (...args: string[]) => void) => void) =>
    and(/^receipt "(.*)" for "(.*)" of "(.*)" was issued today$/, (number: string, name: string, amount: string) => {
      world.receipts.push(receipt({ number, memberName: name, totalAmount: amount }))
    })

  test("Staff see today's receipts by default", ({ given, and, when, then }) => {
    givenStaff(given)
    givenIssuedToday(and)
    when('they open the receipt register', () => openRegister(world))
    then(/^the register lists receipt "(.*)" for "(.*)"$/, async (number: string, name: string) => {
      const row = await rowFor(number)
      expect(within(row).getByText(name)).toBeInTheDocument()
    })
  })

  test('Staff search the register by M-Pesa code', ({ given, and, when, then }) => {
    givenStaff(given)
    and(/^receipt "(.*)" paid with M-Pesa code "(.*)" is voided$/, (number: string, code: string) => {
      const voided = receipt({ id: '12', number, channel: 'mpesa_c2b', mpesaCode: code, status: 'void' })
      world.extraMocks.push(receiptsMock(code, [voided]))
    })
    when('they open the receipt register', () => openRegister(world))
    and(/^they search for "(.*)"$/, async (term: string) => {
      await screen.findByText('No receipts found')
      fireEvent.change(screen.getByLabelText('Search'), { target: { value: term } })
      fireEvent.click(screen.getByRole('button', { name: /^Search$/ }))
    })
    then(/^the register lists receipt "(.*)" marked VOID$/, async (number: string) => {
      const row = await rowFor(number)
      expect(within(row).getByText('VOID')).toBeInTheDocument()
    })
  })

  test('A pastor cannot void a receipt', ({ given, and, when, then }) => {
    givenStaff(given)
    givenIssuedToday(and)
    when('they open the receipt register', () => openRegister(world))
    then('no void action is offered', async () => {
      await rowFor('20260917-0003')
      await waitFor(() => expect(screen.queryByLabelText(/Void receipt/)).not.toBeInTheDocument())
    })
  })

  test('A treasurer must give a reason to void', ({ given, and, when, then }) => {
    given('a signed-in treasurer', () => {
      world.canVoid = true
    })
    givenIssuedToday(and)
    when('they open the receipt register', () => openRegister(world))
    and(/^they void receipt "(.*)" with reason "(.*)"$/, async (number: string, reason: string) => {
      fireEvent.click((await screen.findAllByLabelText(`Void receipt ${number}`))[0])
      const dialog = await screen.findByRole('dialog')
      fireEvent.change(within(dialog).getByLabelText('Reason'), { target: { value: reason } })
      fireEvent.click(within(dialog).getByRole('button', { name: 'Void receipt' }))
    })
    then('they are told the reason needs at least 10 characters', async () => {
      const dialog = await screen.findByRole('dialog')
      expect(within(dialog).getByText(/at least 10 characters/)).toBeInTheDocument()
    })
  })

  test('A treasurer voids a receipt with a reason', ({ given, and, when, then }) => {
    given('a signed-in treasurer', () => {
      world.canVoid = true
    })
    givenIssuedToday(and)
    when('they open the receipt register', () => {
      world.extraMocks.push(
        {
          request: { query: VOID_RECEIPT, variables: { receiptId: '11', reason: 'Amount entered wrongly' } },
          result: {
            data: {
              voidReceipt: {
                __typename: 'ReceiptVoidResponse',
                success: true,
                message: 'Receipt 20260917-0003 voided',
                receiptNumber: '20260917-0003',
                status: 'void',
              },
            },
          },
        },
        receiptsMock(null, [receipt({ status: 'void', voidReason: 'Amount entered wrongly' })])
      )
      openRegister(world)
    })
    and(/^they void receipt "(.*)" with reason "(.*)"$/, async (number: string, reason: string) => {
      fireEvent.click((await screen.findAllByLabelText(`Void receipt ${number}`))[0])
      const dialog = await screen.findByRole('dialog')
      fireEvent.change(within(dialog).getByLabelText('Reason'), { target: { value: reason } })
      fireEvent.click(within(dialog).getByRole('button', { name: 'Void receipt' }))
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })
    then(/^the register lists receipt "(.*)" marked VOID$/, async (number: string) => {
      await waitFor(async () => {
        const row = await rowFor(number)
        expect(within(row).getByText('VOID')).toBeInTheDocument()
      })
    })
  })
})
