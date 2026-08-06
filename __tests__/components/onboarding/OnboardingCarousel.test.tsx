/**
 * First-run onboarding carousel component tests (Wave 1 / member parity;
 * backend-synced). Apollo is mocked via MockedProvider — see
 * __tests__/lib/hooks/use-onboarding.test.tsx for the hook-level coverage.
 */

import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing/react'

import { OnboardingCarousel } from '@/components/onboarding/OnboardingCarousel'
import { ONBOARDING_STORAGE_KEY, ONBOARDING_TUTORIAL_KEY } from '@/lib/hooks/use-onboarding'
import { GET_TUTORIAL_STATE } from '@/lib/graphql/tutorial-queries'
import { UPDATE_TUTORIAL_STATUS } from '@/lib/graphql/tutorial-mutations'

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

function renderCarousel(props: React.ComponentProps<typeof OnboardingCarousel> = {}) {
  return render(
    <MockedProvider mocks={[notCompletedMock, completeMutationMock]} addTypename={false}>
      <OnboardingCarousel {...props} />
    </MockedProvider>
  )
}

describe('OnboardingCarousel', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('given onboarding incomplete, when rendered, then the first slide and a Skip control are visible', () => {
    renderCarousel()
    expect(screen.getByRole('dialog', { name: /welcome/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })

  it('given onboarding already complete, when rendered, then nothing is shown', () => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
    renderCarousel()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('given Skip clicked, when invoked, then the carousel closes and the flag is stored', () => {
    renderCarousel()
    fireEvent.click(screen.getByRole('button', { name: /skip/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(window.localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe('true')
  })

  it('given the last slide, when Get Started clicked, then onComplete fires and the flag is stored', () => {
    const onComplete = vi.fn()
    renderCarousel({ onComplete })

    // Advance to the last slide via Next.
    let next = screen.queryByRole('button', { name: /next/i })
    while (next) {
      fireEvent.click(next)
      next = screen.queryByRole('button', { name: /next/i })
    }

    const getStarted = screen.getByRole('button', { name: /get started/i })
    fireEvent.click(getStarted)

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(window.localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe('true')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('given Next clicked once, when on slide one, then slide two content is shown', () => {
    renderCarousel()
    const firstHeading = screen.getByRole('heading', { level: 2 }).textContent
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    const secondHeading = screen.getByRole('heading', { level: 2 }).textContent
    expect(secondHeading).not.toEqual(firstHeading)
  })
})
