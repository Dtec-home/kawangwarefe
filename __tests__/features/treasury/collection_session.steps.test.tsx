/**
 * Binding for `treasury/collection_session.feature` (T5.3).
 *
 * Renders the real recorder workspace, collection sessions page and
 * certification control against Apollo's MockedProvider with the production
 * GraphQL documents, so variables must match what the backend receives.
 */

import { defineFeature, loadFeature } from 'jest-cucumber'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import React from 'react'
import { expect, vi } from 'vitest'

const { role, toastMock } = vi.hoisted(() => ({
  role: {
    current: { isPureRecorder: true, isRecorder: true, isStaff: false, canManageBooks: false, isAdmin: false, loading: false },
  },
  toastMock: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

vi.mock('sonner', () => ({ toast: toastMock }))
vi.mock('@/lib/hooks/use-user-role', () => ({ useUserRole: () => role.current }))
vi.mock('@/lib/hooks/use-active-entry-unlocks', () => ({
  useActiveEntryUnlocks: () => ({ unlocks: [], unlockDates: [], hasActiveUnlocks: false, loading: false, refetch: vi.fn() }),
}))
vi.mock('@/components/layouts/admin-layout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/auth/admin-protected-route', () => ({
  AdminProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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
  CERTIFY_STATEMENT,
  CLOSE_COLLECTION_SESSION,
  CONFIRM_COLLECTION_SESSION,
  GET_COLLECTION_SESSIONS,
  GET_MY_OPEN_COLLECTION_SESSION,
  GET_STATEMENT_CERTIFICATIONS,
  OPEN_COLLECTION_SESSION,
} from '@/lib/graphql/collection-session-queries'
import { CREATE_MANUAL_MULTI_CONTRIBUTION } from '@/lib/graphql/manual-contribution-mutations'
import { GET_CONTRIBUTION_CATEGORIES, GET_PAYBILL_INSTRUCTION_MESSAGE } from '@/lib/graphql/queries'
import { GET_MY_RECORDED_RECEIPTS } from '@/lib/graphql/recorder-queries'
import { RecorderWorkspace } from '@/components/recorder/recorder-workspace'
import { StatementCertificationControl } from '@/components/treasury/statement-certification'
import CollectionSessionsPage from '@/app/(dashboard)/admin/collection-sessions/page'
import { nairobiToday } from '@/lib/treasury/entry-dates'

const feature = loadFeature('./collection_session.feature', { loadRelativePath: true })

const RECORDER = { isPureRecorder: true, isRecorder: true, isStaff: false, canManageBooks: false, isAdmin: false, loading: false }
const TREASURER = { isPureRecorder: false, isRecorder: false, isStaff: true, canManageBooks: true, isAdmin: false, loading: false }

const CATEGORIES = [{ id: '1', name: 'Tithe', code: 'TITHE' }].map((c) => ({
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

type Row = Record<string, unknown>

function session(overrides: Row = {}): Row {
  return {
    __typename: 'CollectionSessionType',
    id: '5',
    date: nairobiToday(),
    name: 'Divine Service',
    status: 'open',
    openedByName: 'Rita Recorder',
    countedCash: null,
    countedBreakdown: [],
    varianceReason: '',
    recordedTotal: '0.00',
    variance: null,
    receiptCount: 0,
    closedByName: null,
    closedAt: null,
    confirmedByName: null,
    confirmedAt: null,
    createdAt: '2026-09-17T06:00:00Z',
    ...overrides,
  }
}

interface World {
  open: Row | null
  sessions: Row[]
  certifications: Row[]
  closeCalls: Row[]
  keys: string[]
  extra: MockedResponse[]
}

function recorderMocks(world: World): MockedResponse[] {
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
      request: { query: GET_MY_RECORDED_RECEIPTS, variables: () => true },
      result: {
        data: {
          myRecordedReceipts: { __typename: 'MyRecordedReceipts', date: '2026-09-17', count: 0, voidCount: 0, totalAmount: '0.00', items: [] },
        },
      },
      maxUsageCount: 50,
    },
    {
      request: { query: GET_MY_OPEN_COLLECTION_SESSION, variables: () => true },
      result: () => ({ data: { myOpenCollectionSession: world.open } }),
      maxUsageCount: 50,
    },
    {
      request: { query: OPEN_COLLECTION_SESSION, variables: () => true },
      result: (variables: { name: string }) => {
        world.open = session({ name: variables.name })
        return { data: { openCollectionSession: { __typename: 'CollectionSessionResponse', success: true, message: 'Collection session opened', session: world.open } } }
      },
    },
    {
      request: { query: CLOSE_COLLECTION_SESSION, variables: () => true },
      result: (variables: Row) => {
        world.closeCalls.push(variables)
        const closed = session({ ...world.open, status: 'closed', countedCash: variables.countedCash, varianceReason: variables.varianceReason ?? '' })
        world.open = null
        return { data: { closeCollectionSession: { __typename: 'CollectionSessionResponse', success: true, message: 'Collection session closed', session: closed } } }
      },
    },
    ...world.extra,
  ]
}

function staffMocks(world: World): MockedResponse[] {
  return [
    {
      request: { query: GET_COLLECTION_SESSIONS, variables: () => true },
      result: () => ({ data: { collectionSessions: world.sessions } }),
      maxUsageCount: 50,
    },
    {
      request: { query: GET_STATEMENT_CERTIFICATIONS, variables: () => true },
      result: () => ({ data: { statementCertifications: world.certifications } }),
      maxUsageCount: 50,
    },
    {
      request: { query: CONFIRM_COLLECTION_SESSION, variables: () => true },
      result: (variables: { id: string }) => {
        const target = world.sessions.find((s) => s.id === variables.id)!
        Object.assign(target, { status: 'confirmed', confirmedByName: 'Tom Treasurer', confirmedAt: '2026-09-12T12:00:00Z' })
        return { data: { confirmCollectionSession: { __typename: 'CollectionSessionResponse', success: true, message: 'Collection session confirmed', session: target } } }
      },
    },
    {
      request: { query: CERTIFY_STATEMENT, variables: () => true },
      result: (variables: { date: string }) => {
        const certification = {
          __typename: 'StatementCertificationType',
          id: '9',
          date: variables.date,
          certifiedByName: 'Tom Treasurer',
          certifiedAt: '2026-09-12T15:30:00Z',
          isActive: true,
          unlockedAt: null,
          unlockedByName: null,
          unlockReason: '',
        }
        world.certifications = [certification]
        return { data: { certifyStatement: { __typename: 'StatementCertificationResponse', success: true, message: 'Statement certified', certification } } }
      },
    },
  ]
}

function renderWith(mocks: MockedResponse[], ui: React.ReactElement) {
  render(<MockedProvider mocks={mocks}>{ui}</MockedProvider>)
}

async function closeAndCount(counted: string, fill?: (dialog: HTMLElement) => void) {
  fireEvent.click(await screen.findByRole('button', { name: /Close & count/ }))
  const dialog = await screen.findByRole('dialog')
  fireEvent.change(within(dialog).getByLabelText('Counted cash (KES)'), { target: { value: counted } })
  fill?.(dialog)
  return dialog
}

defineFeature(feature, (test) => {
  let world: World

  beforeEach(() => {
    cleanup()
    world = { open: null, sessions: [], certifications: [], closeCalls: [], keys: [], extra: [] }
    role.current = RECORDER
    for (const fn of Object.values(toastMock)) fn.mockReset()
  })

  test('A recorder opens a session, records gifts and closes it with a variance', ({ given, when, then }) => {
    given('a signed-in recorder with no open collection session', () => {
      renderWith(recorderMocks(world), <RecorderWorkspace />)
    })
    when(/^they start a collection session named "(.*)"$/, async (name: string) => {
      fireEvent.change(await screen.findByLabelText('Session name'), { target: { value: name } })
      fireEvent.click(screen.getByRole('button', { name: /Start collection session/ }))
    })
    then(/^the session banner shows "(.*)"$/, async (text: string) => {
      await waitFor(() => expect(screen.getByTestId('session-totals')).toHaveTextContent(text))
    })
    when(/^gifts totalling "(.*)" in "(.*)" receipts are recorded in the session$/, (total: string, count: string) => {
      world.open = { ...world.open, recordedTotal: total, receiptCount: Number(count) }
      // The workspace refreshes when the recorder returns to the app
      fireEvent(window, new Event('focus'))
    })
    then(/^the session banner shows "(.*)"$/, async (text: string) => {
      await waitFor(() => expect(screen.getByTestId('session-totals')).toHaveTextContent(text))
    })
    when(/^they close and count "(.*)" with the reason "(.*)"$/, async (counted: string, reason: string) => {
      const dialog = await closeAndCount(counted)
      fireEvent.change(within(dialog).getByLabelText('Reason for the difference'), { target: { value: reason } })
      fireEvent.click(within(dialog).getByRole('button', { name: 'Close session' }))
    })
    then(/^the session is closed with counted cash "(.*)" and the reason "(.*)"$/, async (counted: string, reason: string) => {
      await waitFor(() =>
        expect(world.closeCalls).toEqual([{ id: '5', countedCash: counted, countedBreakdown: null, varianceReason: reason }])
      )
      expect(await screen.findByLabelText('Session name')).toBeInTheDocument()
    })
  })

  test('A denomination breakdown must add up to the counted cash', ({ given, when, then, and }) => {
    given(/^a signed-in recorder with an open session recording "(.*)" in "(.*)" receipts$/, (total: string, count: string) => {
      world.open = session({ recordedTotal: total, receiptCount: Number(count) })
      renderWith(recorderMocks(world), <RecorderWorkspace />)
    })
    when(/^they count "(.*)" as "(.*)" x KES 1000 and "(.*)" x KES 200$/, async (counted: string, thousands: string, twoHundreds: string) => {
      const dialog = await closeAndCount(counted, (d) => {
        fireEvent.change(within(d).getByLabelText('KES 1,000'), { target: { value: thousands } })
        fireEvent.change(within(d).getByLabelText('KES 200'), { target: { value: twoHundreds } })
      })
      fireEvent.click(within(dialog).getByRole('button', { name: 'Close session' }))
    })
    then(/^they are told "(.*)"$/, async (message: string) => {
      expect(await screen.findByTestId('breakdown-error')).toHaveTextContent(message)
    })
    and('the session is not closed', async () => {
      await new Promise((r) => setTimeout(r, 20))
      expect(world.closeCalls).toHaveLength(0)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  test('A retried gift is recorded only once', ({ given, when, then, and }) => {
    given('a signed-in recorder whose first save attempt loses the connection', () => {
      const capture = (variables: Row) => {
        world.keys.push(String(variables.idempotencyKey))
        return true
      }
      world.extra = [
        { request: { query: CREATE_MANUAL_MULTI_CONTRIBUTION, variables: capture }, error: new Error('Failed to fetch') },
        {
          request: { query: CREATE_MANUAL_MULTI_CONTRIBUTION, variables: capture },
          result: {
            data: {
              createManualMultiContribution: {
                __typename: 'ManualMultiContributionResponse',
                success: true,
                message: 'This entry was already recorded',
                contributionGroupId: 'g1',
                totalAmount: '200.00',
                receiptNumber: '20260917-0013',
                isGuest: true,
                smsSent: false,
                idempotentReplay: true,
              },
            },
          },
        },
      ]
      renderWith(recorderMocks(world), <RecorderWorkspace />)
    })
    when(/^they record a walk-in gift of "(.*)" from "(.*)" and retry$/, async (amount: string, name: string) => {
      fireEvent.click(await screen.findByLabelText('Walk-in / no phone'))
      fireEvent.change(screen.getByLabelText('Giver Name *'), { target: { value: name } })
      await waitFor(() =>
        expect(screen.getAllByRole('combobox').some((el) => el.querySelector('option[value="1"]'))).toBe(true)
      )
      const select = screen.getAllByRole('combobox').find((el) => el.querySelector('option[value="1"]'))!
      fireEvent.change(select, { target: { value: '1' } })
      fireEvent.change(document.getElementById('amount-0') as HTMLInputElement, { target: { value: amount } })
      fireEvent.click(screen.getByRole('button', { name: /Review & save/ }))
      const dialog = await screen.findByRole('dialog')
      fireEvent.click(within(dialog).getByRole('button', { name: /Confirm & issue receipt/ }))
      fireEvent.click(await within(dialog).findByRole('button', { name: 'Retry' }))
    })
    then('the retry reuses the idempotency key of the first attempt', async () => {
      await screen.findByTestId('issued-receipt-number')
      expect(world.keys.length).toBeGreaterThanOrEqual(2)
      expect(new Set(world.keys).size).toBe(1)
      expect(world.keys[0]).toMatch(/^[0-9a-f-]{36}$/)
    })
    and(/^receipt "(.*)" is shown as already recorded$/, (number: string) => {
      expect(screen.getByTestId('issued-receipt-number')).toHaveTextContent(number)
      expect(toastMock.info).toHaveBeenCalledWith('Already recorded', expect.anything())
    })
  })

  test("The treasurer confirms a counted session's handover", ({ given, when, then }) => {
    given(/^the treasurer is reviewing a closed session "(.*)" short by "(.*)"$/, (name: string, short: string) => {
      role.current = TREASURER
      const today = nairobiToday()
      world.sessions = [
        session({ id: '7', name, status: 'closed', recordedTotal: '1000.00', countedCash: '800.00', variance: `-${short}`, varianceReason: 'Change given to a visitor', receiptCount: 4, date: today }),
      ]
      renderWith(staffMocks(world), <CollectionSessionsPage />)
    })
    when(/^they confirm the handover for "(.*)"$/, async (name: string) => {
      fireEvent.click(await screen.findByRole('button', { name: new RegExp(`Confirm handover for ${name}`) }))
    })
    then(/^the session "(.*)" is shown as confirmed$/, async () => {
      const row = screen.getByTestId('session-row-7')
      await waitFor(() => expect(row).toHaveTextContent('Confirmed'))
      expect(within(row).queryByRole('button', { name: /Confirm handover/ })).not.toBeInTheDocument()
      expect(toastMock.success).toHaveBeenCalledWith('Collection session confirmed')
    })
  })

  test("The treasurer certifies the day's statement", ({ given, when, then }) => {
    given(/^the treasurer is viewing the uncertified statement for "(.*)"$/, async (date: string) => {
      role.current = TREASURER
      renderWith(staffMocks(world), <StatementCertificationControl date={date} />)
      expect(await screen.findByTestId('certification-status')).toHaveTextContent('Not certified')
    })
    when('they certify the statement', async () => {
      fireEvent.click(await screen.findByRole('button', { name: /Certify statement/ }))
      fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Certify and lock' }))
    })
    then(/^the statement shows "(.*)"$/, async (text: string) => {
      await waitFor(() => expect(screen.getByTestId('certification-status')).toHaveTextContent(text))
    })
  })
})
