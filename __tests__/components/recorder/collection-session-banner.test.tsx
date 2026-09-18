/**
 * Collection session banner on /record (T5.3).
 *
 * Drives the real RecorderWorkspace (gift form and today's list stubbed)
 * through MockedProvider with the production session documents.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within, cleanup } from '@testing-library/react'
import { MockedProvider, type MockedResponse } from '@apollo/client/testing/react'
import React from 'react'

const { toastMock } = vi.hoisted(() => ({ toastMock: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }))
vi.mock('sonner', () => ({ toast: toastMock }))
vi.mock('@/lib/hooks/use-user-role', () => ({
  useUserRole: () => ({ isPureRecorder: true, isRecorder: true, isStaff: false, loading: false }),
}))
vi.mock('@/lib/hooks/use-active-entry-unlocks', () => ({
  useActiveEntryUnlocks: () => ({ unlocks: [], unlockDates: [], hasActiveUnlocks: false, loading: false, refetch: vi.fn() }),
}))
vi.mock('@/components/recorder/record-gift-form', () => ({
  RECORDER_ENTRY_TYPES: [{ value: 'cash', label: 'Cash', hint: '' }],
  RecordGiftForm: ({ onRecorded }: { onRecorded?: () => void }) => (
    <button type="button" onClick={onRecorded}>
      Simulate saved gift
    </button>
  ),
}))
vi.mock('@/components/recorder/todays-entries', () => ({ TodaysEntries: () => null }))

import {
  CLOSE_COLLECTION_SESSION,
  GET_MY_OPEN_COLLECTION_SESSION,
  OPEN_COLLECTION_SESSION,
} from '@/lib/graphql/collection-session-queries'
import { GET_MY_RECORDED_RECEIPTS } from '@/lib/graphql/recorder-queries'
import { RecorderWorkspace } from '@/components/recorder/recorder-workspace'
import { nairobiToday } from '@/lib/treasury/entry-dates'

type Session = Record<string, unknown>

function session(overrides: Session = {}): Session {
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
    recordedTotal: '1500.00',
    variance: null,
    receiptCount: 3,
    closedByName: null,
    closedAt: null,
    confirmedByName: null,
    confirmedAt: null,
    createdAt: '2026-09-17T06:00:00Z',
    ...overrides,
  }
}

interface World {
  current: Session | null
  opened: unknown[]
  closed: Record<string, unknown>[]
  sessionError?: boolean
}

function mocks(world: World): MockedResponse[] {
  return [
    {
      request: { query: GET_MY_RECORDED_RECEIPTS, variables: () => true },
      result: {
        data: {
          myRecordedReceipts: {
            __typename: 'MyRecordedReceipts',
            date: '2026-09-17',
            count: 0,
            voidCount: 0,
            totalAmount: '0.00',
            items: [],
          },
        },
      },
      maxUsageCount: 50,
    },
    world.sessionError
      ? {
          request: { query: GET_MY_OPEN_COLLECTION_SESSION, variables: () => true },
          error: new Error('Recording access required'),
          maxUsageCount: 50,
        }
      : {
          request: { query: GET_MY_OPEN_COLLECTION_SESSION, variables: () => true },
          result: () => ({ data: { myOpenCollectionSession: world.current } }),
          maxUsageCount: 50,
        },
    {
      request: { query: OPEN_COLLECTION_SESSION, variables: () => true },
      result: (variables: { name: string }) => {
        world.opened.push(variables)
        world.current = session({ name: variables.name, receiptCount: 0, recordedTotal: '0.00' })
        return {
          data: {
            openCollectionSession: {
              __typename: 'CollectionSessionResponse',
              success: true,
              message: 'Collection session opened',
              session: world.current,
            },
          },
        }
      },
      maxUsageCount: 5,
    },
    {
      request: { query: CLOSE_COLLECTION_SESSION, variables: () => true },
      result: (variables: Record<string, unknown>) => {
        world.closed.push(variables)
        const closed = session({ status: 'closed', countedCash: variables.countedCash })
        world.current = null
        return {
          data: {
            closeCollectionSession: {
              __typename: 'CollectionSessionResponse',
              success: true,
              message: 'Collection session closed',
              session: closed,
            },
          },
        }
      },
      maxUsageCount: 5,
    },
  ]
}

function renderWorkspace(world: World) {
  return render(
    <MockedProvider mocks={mocks(world)}>
      <RecorderWorkspace />
    </MockedProvider>
  )
}

async function openCloseSheet() {
  fireEvent.click(await screen.findByRole('button', { name: /Close & count/ }))
  return screen.findByRole('dialog')
}

describe('Collection session banner', () => {
  let world: World

  beforeEach(() => {
    cleanup()
    world = { current: null, opened: [], closed: [] }
    toastMock.success.mockReset()
    toastMock.error.mockReset()
  })

  it('starts a session named "Divine Service" by default', async () => {
    renderWorkspace(world)
    const name = (await screen.findByLabelText('Session name')) as HTMLInputElement
    expect(name.value).toBe('Divine Service')
    fireEvent.click(screen.getByRole('button', { name: /Start collection session/ }))
    await waitFor(() => expect(world.opened).toEqual([{ name: 'Divine Service' }]))
    expect(await screen.findByTestId('session-name')).toHaveTextContent('Divine Service')
    expect(screen.getByTestId('session-totals')).toHaveTextContent('0 receipts · KES 0.00 recorded')
    expect(toastMock.success).toHaveBeenCalledWith('Collection session opened')
  })

  it('starts a session with a custom name', async () => {
    renderWorkspace(world)
    fireEvent.change(await screen.findByLabelText('Session name'), { target: { value: 'Youth vespers' } })
    fireEvent.click(screen.getByRole('button', { name: /Start collection session/ }))
    await waitFor(() => expect(world.opened).toEqual([{ name: 'Youth vespers' }]))
  })

  it('shows the open session totals and refreshes them after each save', async () => {
    world.current = session()
    renderWorkspace(world)
    expect(await screen.findByTestId('session-totals')).toHaveTextContent('3 receipts · KES 1,500.00 recorded')

    world.current = session({ receiptCount: 4, recordedTotal: '2000.00' })
    fireEvent.click(screen.getByRole('button', { name: 'Simulate saved gift' }))
    await waitFor(() =>
      expect(screen.getByTestId('session-totals')).toHaveTextContent('4 receipts · KES 2,000.00 recorded')
    )
  })

  it('closes a balanced session with a matching denomination breakdown', async () => {
    world.current = session()
    renderWorkspace(world)
    const dialog = await openCloseSheet()
    fireEvent.change(within(dialog).getByLabelText('Counted cash (KES)'), { target: { value: '1500' } })
    fireEvent.change(within(dialog).getByLabelText('KES 1,000'), { target: { value: '1' } })
    fireEvent.change(within(dialog).getByLabelText('KES 200'), { target: { value: '2' } })
    expect(within(dialog).getByTestId('breakdown-total')).toHaveTextContent('KES 1,400.00')
    expect(within(dialog).getByTestId('breakdown-error')).toHaveTextContent(
      'The breakdown adds up to KES 1,400.00, not KES 1,500.00'
    )

    // A mismatched breakdown blocks the close
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close session' }))
    await new Promise((r) => setTimeout(r, 20))
    expect(world.closed).toHaveLength(0)

    fireEvent.change(within(dialog).getByLabelText('KES 100'), { target: { value: '1' } })
    expect(within(dialog).getByTestId('breakdown-total')).toHaveTextContent('KES 1,500.00')
    expect(within(dialog).queryByTestId('breakdown-error')).not.toBeInTheDocument()
    expect(within(dialog).getByTestId('close-variance')).toHaveTextContent('Balanced')
    expect(within(dialog).queryByLabelText('Reason for the difference')).not.toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Close session' }))
    await waitFor(() =>
      expect(world.closed).toEqual([
        {
          id: '5',
          countedCash: '1500.00',
          countedBreakdown: [
            { denomination: '1000', count: 1 },
            { denomination: '200', count: 2 },
            { denomination: '100', count: 1 },
          ],
          varianceReason: null,
        },
      ])
    )
    // Back to "start a session"
    expect(await screen.findByLabelText('Session name')).toBeInTheDocument()
    expect(toastMock.success).toHaveBeenCalledWith('Collection session closed')
  })

  it('requires a variance reason when the count differs', async () => {
    world.current = session()
    renderWorkspace(world)
    const dialog = await openCloseSheet()
    fireEvent.change(within(dialog).getByLabelText('Counted cash (KES)'), { target: { value: '1300' } })
    expect(within(dialog).getByTestId('close-variance')).toHaveTextContent('Cash short')
    expect(within(dialog).getByTestId('close-variance')).toHaveTextContent('Variance −KES 200.00')

    fireEvent.change(within(dialog).getByLabelText('Reason for the difference'), { target: { value: 'change' } })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close session' }))
    expect(await within(dialog).findByText(/at least 10 characters/)).toBeInTheDocument()
    expect(world.closed).toHaveLength(0)

    fireEvent.change(within(dialog).getByLabelText('Reason for the difference'), {
      target: { value: '  Gave KES 200 change to a visitor ' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close session' }))
    await waitFor(() =>
      expect(world.closed).toEqual([
        { id: '5', countedCash: '1300.00', countedBreakdown: null, varianceReason: 'Gave KES 200 change to a visitor' },
      ])
    )
  })

  it('prompts to close & count a session left open from a previous day', async () => {
    world.current = session({ date: '2020-01-04', name: 'Sabbath School' })
    renderWorkspace(world)
    expect(await screen.findByTestId('stale-session-warning')).toHaveTextContent(
      'This session from Sat, 4 Jan 2020 is still open'
    )
    expect(screen.getByTestId('session-banner')).toHaveAttribute('data-state', 'stale')
    expect(screen.queryByLabelText('Session name')).not.toBeInTheDocument()
    const dialog = await openCloseSheet()
    expect(within(dialog).getByText(/Sabbath School · Sat, 4 Jan 2020/)).toBeInTheDocument()
  })

  it('still lets the recorder record when sessions are unavailable', async () => {
    world.sessionError = true
    renderWorkspace(world)
    expect(await screen.findByRole('button', { name: 'Simulate saved gift' })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByTestId('session-banner-loading')).not.toBeInTheDocument())
    expect(screen.queryByTestId('session-banner')).not.toBeInTheDocument()
  })
})
