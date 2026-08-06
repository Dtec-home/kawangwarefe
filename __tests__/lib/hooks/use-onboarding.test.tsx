/**
 * First-run onboarding hook tests (Wave 1 / member parity; backend-synced).
 *
 * The backend (`onboarding_carousel_v1` tutorial key) is the source of
 * truth; localStorage is a fast-path cache. Apollo is mocked via
 * MockedProvider so these tests stay independent of a real backend.
 */

import React from 'react'
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'

import {
  useOnboarding,
  ONBOARDING_STORAGE_KEY,
  ONBOARDING_TUTORIAL_KEY,
} from '@/lib/hooks/use-onboarding'
import { GET_TUTORIAL_STATE } from '@/lib/graphql/tutorial-queries'
import { UPDATE_TUTORIAL_STATUS } from '@/lib/graphql/tutorial-mutations'

// Default mock: backend reports the tutorial as not completed.
const notCompletedMock = {
  request: {
    query: GET_TUTORIAL_STATE,
    variables: { tutorialKey: ONBOARDING_TUTORIAL_KEY },
  },
  result: { data: { isTutorialCompleted: false } },
}

const completeMutationMock = {
  request: {
    query: UPDATE_TUTORIAL_STATUS,
    variables: { tutorialKey: ONBOARDING_TUTORIAL_KEY, completed: true },
  },
  result: {
    data: {
      updateTutorialStatus: {
        success: true,
        message: 'ok',
        tutorialState: { id: '1', completedTutorials: {}, updatedAt: '' },
      },
    },
  },
}

const resetMutationMock = {
  request: {
    query: UPDATE_TUTORIAL_STATUS,
    variables: { tutorialKey: ONBOARDING_TUTORIAL_KEY, completed: false },
  },
  result: {
    data: {
      updateTutorialStatus: {
        success: true,
        message: 'ok',
        tutorialState: { id: '1', completedTutorials: {}, updatedAt: '' },
      },
    },
  },
}

function wrapper(mocks: readonly unknown[]) {
  return ({ children }: { children: React.ReactNode }) => (
    <MockedProvider mocks={mocks as any} addTypename={false}>
      {children}
    </MockedProvider>
  )
}

describe('useOnboarding', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('given the flag is unset, when loaded, then isComplete is false (carousel shows)', () => {
    const { result } = renderHook(() => useOnboarding(), {
      wrapper: wrapper([notCompletedMock]),
    })
    expect(result.current.isComplete).toBe(false)
  })

  it('given complete() is called, when invoked, then isComplete is true and the flag is stored', async () => {
    const { result } = renderHook(() => useOnboarding(), {
      wrapper: wrapper([notCompletedMock, completeMutationMock]),
    })
    act(() => result.current.complete())
    expect(result.current.isComplete).toBe(true)
    expect(window.localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe('true')
  })

  it('given the flag is already set, when loaded, then isComplete is true', () => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
    const { result } = renderHook(() => useOnboarding(), {
      wrapper: wrapper([notCompletedMock]),
    })
    expect(result.current.isComplete).toBe(true)
  })

  it('given reset() is called, when invoked, then isComplete is false and the flag is cleared', async () => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
    const { result } = renderHook(() => useOnboarding(), {
      wrapper: wrapper([notCompletedMock, resetMutationMock]),
    })
    act(() => result.current.reset())
    expect(result.current.isComplete).toBe(false)
    expect(window.localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBeNull()
  })

  it('given the backend reports the tutorial completed, when the query resolves, then the local cache is reconciled to true', async () => {
    const completedMock = {
      request: {
        query: GET_TUTORIAL_STATE,
        variables: { tutorialKey: ONBOARDING_TUTORIAL_KEY },
      },
      result: { data: { isTutorialCompleted: true } },
    }
    const { result } = renderHook(() => useOnboarding(), {
      wrapper: wrapper([completedMock]),
    })
    await waitFor(() => expect(result.current.isComplete).toBe(true))
    expect(window.localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe('true')
  })
})
