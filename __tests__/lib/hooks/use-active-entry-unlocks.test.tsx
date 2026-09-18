/**
 * useActiveEntryUnlocks (T2.8)
 */
import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'
import React from 'react'
import { useActiveEntryUnlocks } from '@/lib/hooks/use-active-entry-unlocks'
import { GET_ACTIVE_ENTRY_DATE_UNLOCKS } from '@/lib/graphql/treasury-queries'

const unlock = (id: string, unlockDate: string) => ({
  __typename: 'EntryDateUnlockType',
  id,
  unlockDate,
  reason: 'Internet outage during service',
  openedByName: 'Jane Admin',
  expiresAt: '2026-09-18T05:30:00Z',
  closedAt: null,
  createdAt: '2026-09-17T05:30:00Z',
  isActive: true,
})

function wrapper(unlocks: unknown[]) {
  const mocks = [{ request: { query: GET_ACTIVE_ENTRY_DATE_UNLOCKS }, result: { data: { activeEntryDateUnlocks: unlocks } } }]
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <MockedProvider mocks={mocks}>{children}</MockedProvider>
  }
  return Wrapper
}

describe('useActiveEntryUnlocks', () => {
  it('returns active windows and their distinct dates, oldest first', async () => {
    const { result } = renderHook(() => useActiveEntryUnlocks(), {
      wrapper: wrapper([unlock('2', '2026-08-30'), unlock('1', '2026-08-29'), unlock('3', '2026-08-30')]),
    })
    await waitFor(() => expect(result.current.unlocks).toHaveLength(3))
    expect(result.current.hasActiveUnlocks).toBe(true)
    expect(result.current.unlockDates).toEqual(['2026-08-29', '2026-08-30'])
  })

  it('reports no windows when none are open', async () => {
    const { result } = renderHook(() => useActiveEntryUnlocks(), { wrapper: wrapper([]) })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hasActiveUnlocks).toBe(false)
    expect(result.current.unlockDates).toEqual([])
  })

  it('does not query when skipped', () => {
    const { result } = renderHook(() => useActiveEntryUnlocks({ skip: true }), { wrapper: wrapper([]) })
    expect(result.current.loading).toBe(false)
    expect(result.current.unlocks).toEqual([])
  })
})
