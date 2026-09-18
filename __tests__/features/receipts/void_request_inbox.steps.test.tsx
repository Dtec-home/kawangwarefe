/**
 * Binding for `receipts/void_request_inbox.feature` (T2.6).
 *
 * Drives the real `VoidRequestsInbox` through Apollo's MockedProvider with the
 * app's real GraphQL documents, so the decision variables must match what the
 * backend receives. Only the Radix `Select` is stubbed — it does not open in
 * jsdom.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import React from 'react'
import { expect, vi } from 'vitest'

const { toastMock } = vi.hoisted(() => ({
  toastMock: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

vi.mock('sonner', () => ({ toast: toastMock }))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/admin/receipts',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('@/components/ui/select', () => ({
  Select: ({ name, value, onValueChange, children }: {
    name?: string
    value?: string
    onValueChange?: (v: string) => void
    children: React.ReactNode
  }) => (
    <select aria-label={name} value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}))

import { DECIDE_VOID_REQUEST, GET_VOID_REQUESTS } from '@/lib/graphql/receipt-queries'
import { VoidRequestsInbox } from '@/components/receipts/void-requests-inbox'

const feature = loadFeature('./void_request_inbox.feature', { loadRelativePath: true })

type Row = Record<string, unknown>

interface DecisionVars {
  requestId: string
  approve: boolean
  note: string | null
}

let nextId = 100

function voidRequest(overrides: Row = {}): Row {
  const number = String(overrides.number ?? '20260917-0007')
  delete overrides.number
  return {
    __typename: 'ReceiptVoidRequestType',
    id: String(nextId++),
    requestedByName: 'Tom Recorder',
    reason: 'Typed 5000 instead of 500',
    status: 'pending',
    decidedByName: null,
    decidedAt: null,
    decisionNote: '',
    createdAt: '2026-09-17T08:00:00Z',
    receipt: {
      __typename: 'ReceiptType',
      id: `r${nextId}`,
      number,
      receiptDate: '2026-09-17',
      channel: 'cash',
      status: 'issued',
      totalAmount: '5000.00',
      giverName: 'Visitor - John',
      memberName: null,
    },
    ...overrides,
  }
}

interface World {
  requests: Row[]
  decisions: DecisionVars[]
  /** Set to make the backend refuse the decision with this message. */
  refusal: string | null
}

function requestsFor(world: World, status: string): Row[] {
  return world.requests.filter((r) => r.status === status)
}

function openInbox(world: World) {
  const mocks: MockedResponse[] = [
    {
      request: { query: GET_VOID_REQUESTS, variables: () => true },
      result: (variables: { status: string }) => ({
        data: { voidRequests: requestsFor(world, variables.status) },
      }),
      maxUsageCount: 20,
    },
    {
      request: { query: DECIDE_VOID_REQUEST, variables: () => true },
      result: (variables: DecisionVars) => {
        world.decisions.push(variables)
        if (world.refusal) {
          return {
            data: {
              decideVoidRequest: {
                __typename: 'ReceiptVoidResponse',
                success: false,
                message: world.refusal,
                receiptNumber: null,
                status: null,
              },
            },
          }
        }
        const target = world.requests.find((r) => r.id === variables.requestId)!
        const receipt = target.receipt as Row
        Object.assign(target, {
          status: variables.approve ? 'approved' : 'rejected',
          decidedByName: 'Ann Treasurer',
          decidedAt: '2026-09-17T09:00:00Z',
          decisionNote: variables.note ?? '',
        })
        if (variables.approve) receipt.status = 'void'
        return {
          data: {
            decideVoidRequest: {
              __typename: 'ReceiptVoidResponse',
              success: true,
              message: 'Decision recorded',
              receiptNumber: receipt.number,
              status: receipt.status,
            },
          },
        }
      },
      maxUsageCount: 5,
    },
  ]
  render(
    <MockedProvider mocks={mocks}>
      <VoidRequestsInbox />
    </MockedProvider>
  )
}

async function cardFor(number: string) {
  const link = await screen.findByRole('link', { name: number })
  return link.closest('li') as HTMLElement
}

async function decide(number: string, action: 'Approve' | 'Reject', note: string) {
  fireEvent.click(await screen.findByLabelText(`${action} void request for ${number}`))
  const dialog = await screen.findByRole('dialog')
  fireEvent.change(within(dialog).getByLabelText('Note (optional)'), { target: { value: note } })
  fireEvent.click(
    within(dialog).getByRole('button', { name: action === 'Approve' ? 'Approve and void' : 'Reject request' })
  )
}

defineFeature(feature, (test) => {
  let world: World

  beforeEach(() => {
    cleanup()
    toastMock.success.mockReset()
    toastMock.error.mockReset()
    world = { requests: [], decisions: [], refusal: null }
  })

  const givenPending = (step: (m: RegExp, fn: (...args: string[]) => void) => void) =>
    step(
      /^a pending request to void receipt "(.*)", from "(.*)", because "(.*)"$/,
      (number: string, requestedByName: string, reason: string) => {
        world.requests.push(voidRequest({ number, requestedByName, reason }))
      }
    )

  const whenOpened = (when: (m: string, fn: () => void) => void) =>
    when('the treasurer opens the void-request inbox', () => openInbox(world))

  test('The treasurer approves a void request with a note', ({ given, when, then, and }) => {
    givenPending(given)
    whenOpened(when)
    then(
      /^the inbox shows the request for "(.*)" from "(.*)" because "(.*)"$/,
      async (number: string, who: string, reason: string) => {
        const card = await cardFor(number)
        expect(within(card).getByText(reason)).toBeInTheDocument()
        expect(within(card).getByText(new RegExp(`Requested by ${who}`))).toBeInTheDocument()
      }
    )
    when(/^they approve the request for "(.*)" with the note "(.*)"$/, async (number: string, note: string) => {
      await decide(number, 'Approve', note)
    })
    then(
      /^the decision sent for "(.*)" is "(.*)" with the note "(.*)"$/,
      async (_number: string, action: string, note: string) => {
        await waitFor(() => expect(world.decisions).toHaveLength(1))
        expect(world.decisions[0].approve).toBe(action === 'approve')
        expect(world.decisions[0].note).toBe(note)
      }
    )
    and(/^they are told receipt "(.*)" is now VOID$/, async (number: string) => {
      await waitFor(() =>
        expect(toastMock.success).toHaveBeenCalledWith(`Void approved — receipt ${number} is now VOID`)
      )
    })
  })

  test('The treasurer rejects a void request with a note', ({ given, when, then, and }) => {
    givenPending(given)
    whenOpened(when)
    and(/^they reject the request for "(.*)" with the note "(.*)"$/, async (number: string, note: string) => {
      await decide(number, 'Reject', note)
    })
    then(
      /^the decision sent for "(.*)" is "(.*)" with the note "(.*)"$/,
      async (_number: string, action: string, note: string) => {
        await waitFor(() => expect(world.decisions).toHaveLength(1))
        expect(world.decisions[0].approve).toBe(action === 'approve')
        expect(world.decisions[0].note).toBe(note)
      }
    )
    and(/^they are told the request for "(.*)" was rejected$/, async (number: string) => {
      await waitFor(() =>
        expect(toastMock.success).toHaveBeenCalledWith(`Void request for ${number} rejected`)
      )
    })
  })

  test('A decision that the backend refuses leaves the request pending', ({ given, and, when, then }) => {
    givenPending(given)
    and(/^the backend refuses the decision with "(.*)"$/, (message: string) => {
      world.refusal = message
    })
    whenOpened(when)
    and(/^they approve the request for "(.*)" with the note "(.*)"$/, async (number: string, note: string) => {
      await decide(number, 'Approve', note)
    })
    then(/^they are told "(.*)"$/, async (message: string) => {
      await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith(message))
      expect(toastMock.success).not.toHaveBeenCalled()
    })
    and(/^the request for "(.*)" is still awaiting a decision once they close the dialog$/, async (number: string) => {
      const dialog = await screen.findByRole('dialog')
      fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      const card = await cardFor(number)
      expect(within(card).getByLabelText(`Approve void request for ${number}`)).toBeInTheDocument()
      expect(within(card).getByLabelText(`Reject void request for ${number}`)).toBeInTheDocument()
    })
  })

  test('A decided request is read only and says who decided it', ({ given, when, and, then }) => {
    given(
      /^receipt "(.*)" has an approved void request decided by "(.*)" noting "(.*)"$/,
      (number: string, decidedByName: string, decisionNote: string) => {
        world.requests.push(
          voidRequest({
            number,
            status: 'approved',
            decidedByName,
            decidedAt: '2026-09-17T09:00:00Z',
            decisionNote,
            receipt: {
              __typename: 'ReceiptType',
              id: 'r9',
              number,
              receiptDate: '2026-09-17',
              channel: 'cash',
              status: 'void',
              totalAmount: '5000.00',
              giverName: 'Visitor - John',
              memberName: null,
            },
          })
        )
      }
    )
    whenOpened(when)
    and(/^they list the "(.*)" requests$/, async (label: string) => {
      await screen.findByText('No pending void requests')
      fireEvent.change(screen.getByLabelText('voidRequestStatus'), { target: { value: label.toLowerCase() } })
    })
    then(
      /^the request for "(.*)" shows it was decided by "(.*)" noting "(.*)"$/,
      async (number: string, who: string, note: string) => {
        const card = await cardFor(number)
        expect(within(card).getByText(new RegExp(`Approved by ${who}.*${note}`))).toBeInTheDocument()
      }
    )
    and(/^the request for "(.*)" offers no approve or reject action$/, async (number: string) => {
      const card = await cardFor(number)
      expect(within(card).queryByLabelText(`Approve void request for ${number}`)).not.toBeInTheDocument()
      expect(within(card).queryByLabelText(`Reject void request for ${number}`)).not.toBeInTheDocument()
    })
  })

  test('An empty inbox says so', ({ given, when, then }) => {
    given('there are no void requests', () => {
      world.requests = []
    })
    whenOpened(when)
    then(/^the inbox shows "(.*)"$/, async (message: string) => {
      expect(await screen.findByText(message)).toBeInTheDocument()
    })
  })
})
