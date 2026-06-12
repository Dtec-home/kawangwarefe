/**
 * First-run onboarding hook tests (Wave 1 / member parity).
 *
 * Mirrors the mobile app's first-run intro: a localStorage flag gates the
 * carousel so it only ever shows once. No backend involvement.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import {
  useOnboarding,
  ONBOARDING_STORAGE_KEY,
} from '@/lib/hooks/use-onboarding'

describe('useOnboarding', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('given the flag is unset, when loaded, then isComplete is false (carousel shows)', () => {
    const { result } = renderHook(() => useOnboarding())
    expect(result.current.isComplete).toBe(false)
  })

  it('given complete() is called, when invoked, then isComplete is true and the flag is stored', () => {
    const { result } = renderHook(() => useOnboarding())
    act(() => result.current.complete())
    expect(result.current.isComplete).toBe(true)
    expect(window.localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe('true')
  })

  it('given the flag is already set, when loaded, then isComplete is true', () => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
    const { result } = renderHook(() => useOnboarding())
    expect(result.current.isComplete).toBe(true)
  })

  it('given reset() is called, when invoked, then isComplete is false and the flag is cleared', () => {
    window.localStorage.setItem(ONBOARDING_STORAGE_KEY, 'true')
    const { result } = renderHook(() => useOnboarding())
    act(() => result.current.reset())
    expect(result.current.isComplete).toBe(false)
    expect(window.localStorage.getItem(ONBOARDING_STORAGE_KEY)).toBeNull()
  })
})
