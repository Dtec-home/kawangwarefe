/**
 * Binding for `treasury/catch_up_windows.feature` (T2.8 UI).
 *
 * Renders the real /admin/catch-up-windows page against Apollo's MockedProvider
 * with the production GraphQL documents, so the mutation variables must match
 * what the backend receives. Only the route guard and the admin chrome are
 * stubbed.
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
  usePathname: () => '/admin/catch-up-windows',
  useSearchParams: () => new URLSearchParams(),
}))
vi.mock('@/components/layouts/admin-layout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))
vi.mock('@/components/auth/admin-protected-route', () => ({
  AdminProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

import {
  CLOSE_ENTRY_DATE_UNLOCK,
  OPEN_ENTRY_DATE_UNLOCK,
} from '@/lib/graphql/treasury-mutations'
import { GET_ACTIVE_ENTRY_DATE_UNLOCKS } from '@/lib/graphql/treasury-queries'
import CatchUpWindowsPage from '@/app/(dashboard)/admin/catch-up-windows/page'

const feature = loadFeature('./catch_up_windows.feature', { loadRelativePath: true })

/** 12:00 in Nairobi on Thu 17 Sep 2026 */
const NOW = new Date('2026-09-17T09:00:00Z')

type Row = Record<string, unknown>

interface OpenVars {
  date: string
  reason: string
  hours: number
}

function unlock(overrides: Row = {}): Row {
  return {
    __typename: 'EntryDateUnlockType',
    id: '7',
    unlockDate: '2026-08-29',
    reason: 'Internet outage during service',
    openedByName: 'Jane Admin',
    expiresAt: '2026-09-18T05:30:00Z',
    closedAt: null,
    createdAt: '2026-09-17T05:30:00Z',
    isActive: true,
    ...overrides,
  }
}

interface World {
  unlocks: Row[]
  opened: OpenVars[]
  closed: string[]
  /** Set to make the backend refuse the mutation with this message. */
  refusal: string | null
}

function openPage(world: World) {
  const mocks: MockedResponse[] = [
    {
      request: { query: GET_ACTIVE_ENTRY_DATE_UNLOCKS, variables: () => true },
      result: () => ({ data: { activeEntryDateUnlocks: world.unlocks } }),
      maxUsageCount: 20,
    },
    {
      request: { query: OPEN_ENTRY_DATE_UNLOCK, variables: () => true },
      result: (variables: OpenVars) => {
        world.opened.push(variables)
        if (world.refusal) {
          return { data: { openEntryDateUnlock: { __typename: 'EntryDateUnlockResponse', success: false, message: world.refusal, unlock: null } } }
        }
        const created = unlock({ unlockDate: variables.date, reason: variables.reason })
        world.unlocks = [...world.unlocks, created]
        return {
          data: {
            openEntryDateUnlock: {
              __typename: 'EntryDateUnlockResponse',
              success: true,
              message: 'Catch-up window opened',
              unlock: created,
            },
          },
        }
      },
      maxUsageCount: 5,
    },
    {
      request: { query: CLOSE_ENTRY_DATE_UNLOCK, variables: () => true },
      result: (variables: { id: string }) => {
        world.closed.push(variables.id)
        if (world.refusal) {
          return { data: { closeEntryDateUnlock: { __typename: 'EntryDateUnlockResponse', success: false, message: world.refusal, unlock: null } } }
        }
        const target = world.unlocks.find((u) => u.id === variables.id)!
        const closed = { ...target, closedAt: '2026-09-17T09:00:00Z', isActive: false }
        world.unlocks = world.unlocks.filter((u) => u.id !== variables.id)
        return {
          data: {
            closeEntryDateUnlock: {
              __typename: 'EntryDateUnlockResponse',
              success: true,
              message: 'Catch-up window closed',
              unlock: closed,
            },
          },
        }
      },
      maxUsageCount: 5,
    },
  ]
  render(
    <MockedProvider mocks={mocks}>
      <CatchUpWindowsPage />
    </MockedProvider>
  )
}

function fillAndSubmit({ date, hours, reason }: { date: string; hours: string; reason: string }) {
  fireEvent.change(screen.getByLabelText('Date to open'), { target: { value: date } })
  fireEvent.change(screen.getByLabelText('Reason'), { target: { value: reason } })
  fireEvent.change(screen.getByLabelText('Duration (hours)'), { target: { value: hours } })
  fireEvent.click(screen.getByRole('button', { name: /open catch-up window/i }))
}

async function windowRow(label: string) {
  const list = await screen.findByRole('list', { name: 'Open catch-up windows' })
  const heading = await within(list).findByText(label)
  return heading.closest('li') as HTMLElement
}

defineFeature(feature, (test) => {
  let world: World

  beforeEach(() => {
    cleanup()
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    toastMock.success.mockReset()
    toastMock.error.mockReset()
    world = { unlocks: [], opened: [], closed: [], refusal: null }
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  const givenNoWindow = (given: (m: string, fn: () => void) => void) =>
    given('no catch-up window is open', () => {
      world.unlocks = []
    })

  const givenWindowOpen = (given: (m: RegExp, fn: (...args: string[]) => void) => void) =>
    given(/^a catch-up window is open for "(.*)" because "(.*)"$/, (date: string, reason: string) => {
      world.unlocks = [unlock({ unlockDate: date, reason })]
    })

  const thenNothingSent = (and: (m: string, fn: () => void) => void) =>
    and('no window is sent to the backend', () => {
      expect(world.opened).toEqual([])
    })

  const thenListShows = (and: (m: RegExp, fn: (...args: string[]) => void) => void) =>
    and(/^the open windows list shows "(.*)" because "(.*)"$/, async (label: string, reason: string) => {
      const row = await windowRow(label)
      expect(within(row).getByText(reason)).toBeInTheDocument()
    })

  test('An admin opens a catch-up window for a past date', ({ given, when, then, and }) => {
    givenNoWindow(given)
    when(
      /^the admin opens a window for "(.*)" for "(.*)" hours because "(.*)"$/,
      async (date: string, hours: string, reason: string) => {
        openPage(world)
        await screen.findByText('No open catch-up windows')
        fillAndSubmit({ date, hours, reason })
      }
    )
    then(
      /^the window sent to the backend is "(.*)" for "(.*)" hours because "(.*)"$/,
      async (date: string, hours: string, reason: string) => {
        await waitFor(() => expect(world.opened).toHaveLength(1))
        expect(world.opened[0]).toEqual({ date, reason, hours: Number(hours) })
      }
    )
    thenListShows(and)
    and(/^they are told "(.*)"$/, (message: string) => {
      expect(toastMock.success).toHaveBeenCalledWith(message)
    })
  })

  test('A window needs a past date and a real reason', ({ given, when, then, and }) => {
    givenNoWindow(given)
    when(
      /^the admin opens a window for "(.*)" for "(.*)" hours because "(.*)"$/,
      async (date: string, hours: string, reason: string) => {
        openPage(world)
        await screen.findByText('No open catch-up windows')
        fillAndSubmit({ date, hours, reason })
      }
    )
    then('they are told to choose the date to open', () => {
      expect(screen.getByText('Choose the date to open.')).toBeInTheDocument()
    })
    and('they are told the reason needs at least 10 characters', () => {
      expect(screen.getByText('Give a reason of at least 10 characters.')).toBeInTheDocument()
    })
    thenNothingSent(and)
  })

  test('Today cannot be opened', ({ given, when, then, and }) => {
    givenNoWindow(given)
    when(
      /^the admin opens a window for "(.*)" for "(.*)" hours because "(.*)"$/,
      async (date: string, hours: string, reason: string) => {
        openPage(world)
        await screen.findByText('No open catch-up windows')
        fillAndSubmit({ date, hours, reason })
      }
    )
    then('they are told today and future dates cannot be opened', () => {
      expect(
        screen.getByText("Choose a past date — today and future dates can't be opened.")
      ).toBeInTheDocument()
    })
    thenNothingSent(and)
  })

  test('An admin closes a catch-up window once the entries are in', ({ given, when, then, and }) => {
    givenWindowOpen(given)
    when(/^the admin closes the window for "(.*)"$/, async (label: string) => {
      openPage(world)
      const row = await windowRow(label)
      fireEvent.click(within(row).getByLabelText(`Close window for ${label}`))
    })
    then(/^the window closed at the backend is the one for "(.*)"$/, async (date: string) => {
      await waitFor(() => expect(world.closed).toHaveLength(1))
      expect(world.closed[0]).toBe(unlock({ unlockDate: date }).id)
    })
    and(/^they are told "(.*)"$/, async (message: string) => {
      await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith(message))
    })
    and('the open windows list shows no windows', async () => {
      expect(await screen.findByText('No open catch-up windows')).toBeInTheDocument()
    })
  })

  test('A refused close leaves the window open', ({ given, and, when, then }) => {
    givenWindowOpen(given)
    and(/^the backend refuses with "(.*)"$/, (message: string) => {
      world.refusal = message
    })
    when(/^the admin closes the window for "(.*)"$/, async (label: string) => {
      openPage(world)
      const row = await windowRow(label)
      fireEvent.click(within(row).getByLabelText(`Close window for ${label}`))
    })
    then(/^they are told "(.*)"$/, async (message: string) => {
      await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith(message))
      expect(toastMock.success).not.toHaveBeenCalled()
    })
    thenListShows(and)
  })
})
