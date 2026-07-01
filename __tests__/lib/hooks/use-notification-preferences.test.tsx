/**
 * Notification preferences hook + Zod schema tests (Wave 1 / member parity).
 *
 * Persistence is localStorage-only: no member-preferences mutation exists in
 * lib/graphql/ (verified), so the hook is the single source of truth and these
 * tests exercise its load/save/default behaviour directly.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import {
  notificationPreferencesSchema,
  defaultNotificationPreferences,
  NOTIFICATION_PREFERENCES_STORAGE_KEY,
} from '@/lib/notifications/notification-preferences-schema'
import { useNotificationPreferences } from '@/lib/hooks/use-notification-preferences'

describe('notificationPreferencesSchema', () => {
  it('given an empty object, when parsed, then defaults every channel to true', () => {
    const parsed = notificationPreferencesSchema.parse({})
    expect(parsed).toEqual({
      announcements: true,
      events: true,
      devotionals: true,
      contributionReminders: true,
    })
  })

  it('given partial stored prefs, when parsed, then known fields persist and missing default to true', () => {
    const parsed = notificationPreferencesSchema.parse({ announcements: false })
    expect(parsed.announcements).toBe(false)
    expect(parsed.events).toBe(true)
  })

  it('given a non-boolean value, when parsed, then it throws (schema rejects junk)', () => {
    expect(() =>
      notificationPreferencesSchema.parse({ events: 'yes' })
    ).toThrow()
  })
})

describe('useNotificationPreferences', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('given no stored prefs, when loaded, then defaults are all true', () => {
    const { result } = renderHook(() => useNotificationPreferences())
    expect(result.current.preferences).toEqual(defaultNotificationPreferences)
  })

  it('given prefs saved, when reloaded, then persisted values are returned', () => {
    const { result, unmount } = renderHook(() => useNotificationPreferences())

    act(() => {
      result.current.save({
        announcements: false,
        events: true,
        devotionals: false,
        contributionReminders: true,
      })
    })
    unmount()

    // Fresh mount reads from localStorage.
    const { result: reloaded } = renderHook(() => useNotificationPreferences())
    expect(reloaded.current.preferences.announcements).toBe(false)
    expect(reloaded.current.preferences.devotionals).toBe(false)
    expect(reloaded.current.preferences.events).toBe(true)
  })

  it('given corrupt stored JSON, when loaded, then falls back to defaults', () => {
    window.localStorage.setItem(
      NOTIFICATION_PREFERENCES_STORAGE_KEY,
      '{ not valid json'
    )
    const { result } = renderHook(() => useNotificationPreferences())
    expect(result.current.preferences).toEqual(defaultNotificationPreferences)
  })

  it('given save is called, when invoked, then the new prefs are written to localStorage', () => {
    const { result } = renderHook(() => useNotificationPreferences())
    act(() => {
      result.current.save({
        ...defaultNotificationPreferences,
        contributionReminders: false,
      })
    })
    const raw = window.localStorage.getItem(
      NOTIFICATION_PREFERENCES_STORAGE_KEY
    )
    expect(JSON.parse(raw!).contributionReminders).toBe(false)
  })
})
