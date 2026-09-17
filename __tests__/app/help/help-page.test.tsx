/**
 * Help Center page: role-aware article list (recorder articles, T5.5).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

const { role } = vi.hoisted(() => ({
  role: { canAccessAdmin: false, isRecorder: false, isStaff: false },
}))

vi.mock('@/lib/hooks/use-user-role', () => ({
  useUserRole: () => role,
}))
vi.mock('@/components/auth/protected-route', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))
vi.mock('@/components/layouts/member-layout', () => ({
  MemberLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

import HelpCenterPage from '@/app/(dashboard)/help/page'

describe('Help Center page', () => {
  beforeEach(() => {
    Object.assign(role, { canAccessAdmin: false, isRecorder: false, isStaff: false })
  })

  it('shows a plain member neither recorder nor treasury guides', () => {
    render(<HelpCenterPage />)
    expect(screen.getByText('Receipts and SMS notifications')).toBeInTheDocument()
    expect(screen.queryByText('Recording cash and envelope giving')).not.toBeInTheDocument()
    expect(screen.queryByText('Catch-up windows for past dates')).not.toBeInTheDocument()
  })

  it('shows a pure recorder the recorder guides but not the treasury guides', () => {
    role.isRecorder = true
    render(<HelpCenterPage />)
    expect(screen.getByText('Recording giving')).toBeInTheDocument()
    expect(screen.getByText('Recording cash and envelope giving')).toBeInTheDocument()
    expect(screen.getByText('Collection sessions: start, close and count')).toBeInTheDocument()
    expect(screen.queryByText("Exporting the Treasurer's Cash Statement")).not.toBeInTheDocument()
    expect(screen.queryByText('Unlocking a certified statement')).not.toBeInTheDocument()
  })

  it('shows staff the recorder, treasurer and admin guides', () => {
    Object.assign(role, { canAccessAdmin: true, isStaff: true })
    render(<HelpCenterPage />)
    expect(screen.getByText('Recording cash and envelope giving')).toBeInTheDocument()
    expect(screen.getByText('Receipts register, voids and void requests')).toBeInTheDocument()
    expect(screen.getByText('Catch-up windows for past dates')).toBeInTheDocument()
  })
})
