/**
 * Notification preferences page tests (Wave 1 / member parity).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

vi.mock('@/components/auth/protected-route', () => ({
  ProtectedRoute: ({ children }: any) =>
    React.createElement('div', null, children),
}))

vi.mock('@/components/layouts/member-layout', () => ({
  MemberLayout: ({ children }: any) =>
    React.createElement('div', null, children),
}))

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

import NotificationPreferencesPage from '@/app/(dashboard)/profile/notifications/page'
import { NOTIFICATION_PREFERENCES_STORAGE_KEY } from '@/lib/notifications/notification-preferences-schema'

describe('NotificationPreferencesPage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('given the page renders, then a toggle for each channel and a Save button are shown', () => {
    render(<NotificationPreferencesPage />)
    expect(screen.getByLabelText(/announcements/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/events/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/devotionals/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contribution reminders/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  it('given a switch toggled and Save clicked, when submitted, then the updated prefs are persisted', async () => {
    render(<NotificationPreferencesPage />)

    const announcements = screen.getByLabelText(/announcements/i)
    fireEvent.click(announcements)
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      const raw = window.localStorage.getItem(
        NOTIFICATION_PREFERENCES_STORAGE_KEY
      )
      expect(raw).not.toBeNull()
      expect(JSON.parse(raw!).announcements).toBe(false)
    })
  })
})
