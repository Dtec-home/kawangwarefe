/**
 * First-run onboarding carousel component tests (Wave 1 / member parity).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import { OnboardingCarousel } from '@/components/onboarding/OnboardingCarousel'
import { ONBOARDING_STORAGE_KEY } from '@/lib/hooks/use-onboarding'

describe('OnboardingCarousel', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('given onboarding incomplete, when rendered, then the first slide and a Skip control are visible', () => {
    render(<OnboardingCarousel />)
    expect(screen.getByRole('dialog', { name: /welcome/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })

  it('given onboarding already complete, when rendered, then nothing is shown', () => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
    render(<OnboardingCarousel />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('given Skip clicked, when invoked, then the carousel closes and the flag is stored', () => {
    render(<OnboardingCarousel />)
    fireEvent.click(screen.getByRole('button', { name: /skip/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(window.localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe('true')
  })

  it('given the last slide, when Get Started clicked, then onComplete fires and the flag is stored', () => {
    const onComplete = vi.fn()
    render(<OnboardingCarousel onComplete={onComplete} />)

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
    render(<OnboardingCarousel />)
    const firstHeading = screen.getByRole('heading', { level: 2 }).textContent
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    const secondHeading = screen.getByRole('heading', { level: 2 }).textContent
    expect(secondHeading).not.toEqual(firstHeading)
  })
})
