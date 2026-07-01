/**
 * Admin prayer review page tests (Sprint 7 / Epic E5).
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

const updateStatusFn = vi.fn().mockResolvedValue({
  data: { updatePrayerRequestStatus: { success: true, message: 'Status updated' } },
})

const rows = [
  {
    id: '1', title: 'Healing', body: 'Please pray', status: 'open', visibility: 'team',
    isAnonymous: false, createdAt: '2026-04-24T08:00:00Z',
    requesterDisplayName: 'Jane W',
  },
  {
    id: '2', title: 'Guidance', body: 'Decision', status: 'open', visibility: 'public',
    isAnonymous: true, createdAt: '2026-04-24T09:00:00Z',
    requesterDisplayName: null,
  },
]

vi.mock('@apollo/client/react', () => ({
  useQuery: () => ({
    data: { prayerRequests: rows }, loading: false, error: null, refetch: vi.fn(),
  }),
  useMutation: () => [updateStatusFn, { loading: false }],
}))

vi.mock('@/components/auth/admin-protected-route', () => ({
  AdminProtectedRoute: ({ children }: any) => React.createElement('div', null, children),
}))
vi.mock('@/components/layouts/admin-layout', () => ({
  AdminLayout: ({ children }: any) => React.createElement('div', null, children),
}))

vi.mock('react-hot-toast', () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

import AdminPrayersPage from '@/app/(dashboard)/admin/prayers/page'

describe('AdminPrayersPage', () => {
  it('lists requests and shows Anonymous when appropriate', () => {
    render(<AdminPrayersPage />)
    expect(screen.getByText('Healing')).toBeInTheDocument()
    expect(screen.getByText('Guidance')).toBeInTheDocument()
    expect(screen.getByText(/Jane W/)).toBeInTheDocument()
    expect(screen.getAllByText(/Anonymous/).length).toBeGreaterThan(0)
  })

  it('calls update status mutation when Mark praying is clicked', async () => {
    render(<AdminPrayersPage />)
    const btns = screen.getAllByRole('button', { name: /mark praying/i })
    fireEvent.click(btns[0])
    await Promise.resolve()
    expect(updateStatusFn).toHaveBeenCalled()
    const call = updateStatusFn.mock.calls[updateStatusFn.mock.calls.length - 1][0]
    expect(call.variables).toEqual({ requestId: '1', newStatus: 'praying' })
  })
})
